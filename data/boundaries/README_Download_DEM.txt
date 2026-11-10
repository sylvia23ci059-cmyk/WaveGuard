WAVEGUARD KGF - STARTER GEOGRAPHIC FILES

Contents
- KGF_Taluk_Boundary.gpkg: Kolar Gold Field taluk polygon, reprojected to EPSG:32644 (WGS 84 / UTM zone 44N).
- KGF_Taluk_Boundary_WGS84.geojson: same polygon in EPSG:4326 for web maps and services.

Source
- User-provided Taluk.zip shapefile. Selected record where KGISTalukN = Kolar Gold Field.
- Source CRS declared in Taluk.prj: EPSG:32643. Reprojected, not relabelled, to EPSG:32644 for local metric analysis.

KGF polygon bounds (WGS84)
- West: 78.22711411
- South: 12.85804513
- East: 78.47505995
- North: 13.08287342

Copernicus DEM GLO-30 tiles needed to cover this bounding box
1) 12N, 78E tile:
https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N12_00_E078_00_DEM/Copernicus_DSM_COG_10_N12_00_E078_00_DEM.tif
2) 13N, 78E tile:
https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N13_00_E078_00_DEM/Copernicus_DSM_COG_10_N13_00_E078_00_DEM.tif

The two tile names are derived from the polygon's geographic bounds and the Copernicus 1-degree tile naming scheme. Download both GeoTIFFs and add them to QGIS. Mosaic them with Raster > Miscellaneous > Build Virtual Raster (or GDAL Build Virtual Raster), then clip the mosaic to this boundary. Because the northern edge is just above 13 degrees latitude, both latitude tiles are required.

Important limitations
- Copernicus GLO-30 is a 30 m Digital Surface Model (DSM), not a street-scale bare-earth terrain model. Buildings and vegetation can affect heights. It is suitable for regional screening, not precise underpass depth or street flood prediction.
- The polygon is the taluk boundary, not necessarily the municipal/urban boundary. Hydrological catchments may extend outside it, so expand the DEM analysis area beyond this polygon where upstream flow paths enter the taluk.
- Do not label any location as a confirmed flood hotspot based only on this DEM. Validate with drainage records, historical incidents, and safe field surveys.

Recommended QGIS CRS for local metric analysis: EPSG:32644.
