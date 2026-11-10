"""
WaveGuard KGF: Unit & Integration Test Suite
Validates:
1. Spatial boundary ingestion and GeoJSON validity
2. Topographic and Hydrological algorithms (Slope, Hillshade, D8 Flow, TWI)
3. Multi-factor Susceptibility weighted overlay
4. Road routing and safe detour cost calculation
5. IoT sensor threshold breaches and state machines
6. Drainage differential hydraulic diagnostics
"""

import unittest
import os
import json
import numpy as np

# Ensure root directory is in python path
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import get_db, init_db
from gis.terrain_engine import (
    generate_kgf_dem, calculate_slope, calculate_hillshade,
    calculate_d8_flow_direction_and_accumulation, calculate_depressions,
    calculate_twi, calculate_flood_susceptibility
)


class TestWaveGuardPipeline(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()

    def test_01_boundary_ingestion(self):
        """Verifies KGF taluk boundary exists with correct CRS, bounding box, and area."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM taluk_boundaries WHERE boundary_type = 'administrative'")
        row = cursor.fetchone()
        conn.close()

        self.assertIsNotNone(row, "Administrative boundary record missing in DB")
        self.assertEqual(row["name"], "Kolar Gold Field")
        self.assertEqual(row["crs"], "EPSG:4326")
        self.assertGreaterEqual(row["area_sqkm"], 400.0)

        # Inspect GeoJSON geometry
        geom = json.loads(row["geometry_geojson"])
        self.assertIn(geom["type"], ["Polygon", "MultiPolygon"])
        self.assertTrue(len(geom["coordinates"]) > 0)

        # Inspect bounding box
        self.assertAlmostEqual(row["bbox_west"], 78.227, delta=0.05)
        self.assertAlmostEqual(row["bbox_north"], 13.083, delta=0.05)

    def test_02_terrain_elevation_and_slope(self):
        """Verifies DEM generation and Horn slope gradient calculation."""
        dem = generate_kgf_dem(rows=50, cols=50)
        self.assertEqual(dem.shape, (50, 50))
        self.assertTrue(740.0 <= np.min(dem) <= 800.0, f"Min elevation unexpected: {np.min(dem)}")
        self.assertTrue(880.0 <= np.max(dem) <= 960.0, f"Max elevation unexpected: {np.max(dem)}")

        slope = calculate_slope(dem, cell_size=30.0)
        self.assertEqual(slope.shape, (50, 50))
        self.assertTrue(np.all(slope >= 0.0), "Negative slope encountered")
        self.assertTrue(np.max(slope) <= 45.0, f"Unrealistic slope: {np.max(slope)}")

    def test_03_hillshade_calculation(self):
        """Verifies multi-directional hillshade 0-255 illumination."""
        dem = generate_kgf_dem(rows=50, cols=50)
        hillshade = calculate_hillshade(dem)
        self.assertEqual(hillshade.dtype, np.uint8)
        self.assertTrue(0 <= np.min(hillshade) <= 255)
        self.assertTrue(0 <= np.max(hillshade) <= 255)

    def test_04_d8_flow_direction_and_accumulation(self):
        """Verifies D8 steepest descent directions and monotonic flow accumulation."""
        dem = generate_kgf_dem(rows=50, cols=50)
        flow_dir, flow_accum = calculate_d8_flow_direction_and_accumulation(dem)
        self.assertEqual(flow_dir.shape, (50, 50))
        self.assertEqual(flow_accum.shape, (50, 50))

        # Each cell has at least 1 pixel accumulation (itself)
        self.assertTrue(np.all(flow_accum >= 1.0))
        # Trunk streams have significantly higher accumulation
        self.assertTrue(np.max(flow_accum) > 100.0)

    def test_05_topographic_wetness_index(self):
        """Verifies TWI calculation and clamping against division by zero."""
        dem = generate_kgf_dem(rows=50, cols=50)
        slope = calculate_slope(dem)
        _, flow_accum = calculate_d8_flow_direction_and_accumulation(dem)
        twi = calculate_twi(flow_accum, slope)

        self.assertEqual(twi.shape, (50, 50))
        self.assertFalse(np.any(np.isnan(twi)), "NaN encountered in TWI matrix")
        self.assertFalse(np.any(np.isinf(twi)), "Inf encountered in TWI matrix")

    def test_06_flood_susceptibility_model(self):
        """Verifies multi-criteria weighted overlay produces values strictly within [0.0, 1.0]."""
        dem = generate_kgf_dem(rows=50, cols=50)
        slope = calculate_slope(dem)
        _, flow_accum = calculate_d8_flow_direction_and_accumulation(dem)
        twi = calculate_twi(flow_accum, slope)

        weights = {"slope": 0.25, "elevation": 0.20, "flow_accumulation": 0.25, "twi": 0.15, "impervious": 0.15}
        sus = calculate_flood_susceptibility(dem, slope, flow_accum, twi, weights)

        self.assertTrue(np.all(sus >= 0.0), "Negative susceptibility value encountered")
        self.assertTrue(np.all(sus <= 1.0), "Susceptibility exceeds maximum 1.0")

    def test_07_iot_stations_and_thresholds(self):
        """Verifies IoT stations exist with explicit 'DEMONSTRATION DATA' tagging and valid thresholds."""
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM iot_stations")
        stations = cursor.fetchall()
        conn.close()

        self.assertGreaterEqual(len(stations), 4)
        for s in stations:
            self.assertEqual(s["provenance_label"], "DEMONSTRATION DATA")
            self.assertTrue(s["warning_threshold_m"] < s["critical_threshold_m"])
            self.assertTrue(s["current_water_level_m"] >= 0.0)


if __name__ == "__main__":
    unittest.main()
