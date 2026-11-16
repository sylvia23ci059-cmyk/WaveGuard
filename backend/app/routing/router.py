import logging
import networkx as nx
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.routing.demo_graph import load_demo_graph
from app.models.location import Location
from app.models.road_segment import RoadSegment

logger = logging.getLogger(__name__)

class RouteEngine:
    def __init__(self):
        self._graph_data = load_demo_graph()

    def get_graph_info(self, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Returns full graph info with current edge statuses.
        """
        edges_copy = []
        loc_map = {}
        if db:
            locations = db.query(Location).all()
            loc_map = {loc.id: loc for loc in locations}

        for e in self._graph_data["edges"]:
            edge_dict = dict(e)
            loc_id = edge_dict.get("associated_location_id")
            if loc_id and loc_id in loc_map:
                loc = loc_map[loc_id]
                if loc.current_status == "BLOCKED":
                    edge_dict["status"] = "CONFIRMED_BLOCKED"
                elif loc.current_status == "CAUTION":
                    edge_dict["status"] = "CAUTION"
                else:
                    edge_dict["status"] = "OPEN"
            else:
                edge_dict["status"] = "OPEN"
            edges_copy.append(edge_dict)

        return {
            "graph_id": self._graph_data["graph_id"],
            "name": self._graph_data["name"],
            "description": self._graph_data["description"],
            "nodes": self._graph_data["nodes"],
            "edges": edges_copy
        }

    def calculate_safe_route(
        self,
        db: Session,
        origin_node_id: str,
        destination_node_id: str,
        avoid_blocked: bool = True
    ) -> Dict[str, Any]:
        """
        Calculates shortest path using NetworkX Dijkstra algorithm,
        excluding CONFIRMED_BLOCKED segments if avoid_blocked is True.
        """
        if origin_node_id == destination_node_id:
            return {
                "success": False,
                "path_nodes": [],
                "total_distance_km": 0.0,
                "segments": [],
                "blocked_segments_avoided": [],
                "caution_segments_included": [],
                "is_safe": True,
                "explanation": "Origin and destination are the same location.",
                "geometry_geojson": {"type": "FeatureCollection", "features": []},
                "disclaimer": "PROTOTYPE ROUTE CALCULATION – NOT LIVE TRAFFIC NAVIGATION"
            }

        # Build location status map from DB
        locations = db.query(Location).all()
        loc_map = {loc.id: loc for loc in locations}

        # Build NetworkX undirected graph (bidirectional urban roads)
        G = nx.Graph()

        # Add nodes
        node_lookup = {}
        for n in self._graph_data["nodes"]:
            G.add_node(n["id"], name=n["name"], lat=n["lat"], lng=n["lng"])
            node_lookup[n["id"]] = n

        if origin_node_id not in node_lookup:
            return {"success": False, "explanation": f"Unknown origin node: {origin_node_id}"}
        if destination_node_id not in node_lookup:
            return {"success": False, "explanation": f"Unknown destination node: {destination_node_id}"}

        blocked_edges = []
        caution_edges = []

        # Add edges
        for e in self._graph_data["edges"]:
            loc_id = e.get("associated_location_id")
            is_blocked = False
            is_caution = False
            loc_obj = loc_map.get(loc_id) if loc_id else None

            if loc_obj:
                if loc_obj.current_status == "BLOCKED":
                    is_blocked = True
                elif loc_obj.current_status == "CAUTION":
                    is_caution = True

            # If edge is blocked and user requested avoiding blocked
            if is_blocked and avoid_blocked:
                blocked_edges.append({
                    "edge_id": e["id"],
                    "from_node": e["from_node"],
                    "to_node": e["to_node"],
                    "name": e["name"],
                    "location_name": loc_obj.name if loc_obj else "Underpass",
                    "water_depth_cm": loc_obj.current_water_depth_cm if loc_obj else 0.0,
                    "closure_threshold_cm": loc_obj.closure_threshold_cm if loc_obj else 0.0,
                    "coordinates": e.get("coordinates", [])
                })
                continue  # Exclude from graph

            weight = e["distance_km"]
            # If under caution, add a modest penalty to encourage safer detour if distance is comparable
            if is_caution:
                weight = weight * 1.25

            G.add_edge(
                e["from_node"],
                e["to_node"],
                edge_id=e["id"],
                name=e["name"],
                distance_km=e["distance_km"],
                weight=weight,
                associated_location_id=loc_id,
                coordinates=e.get("coordinates", []),
                is_caution=is_caution
            )

        # Attempt Dijkstra calculation
        try:
            path_nodes = nx.dijkstra_path(G, origin_node_id, destination_node_id, weight="weight")
            total_distance = 0.0
            segments = []
            features = []

            for i in range(len(path_nodes) - 1):
                u = path_nodes[i]
                v = path_nodes[i + 1]
                edge_attrs = G[u][v]
                edge_dist = edge_attrs["distance_km"]
                total_distance += edge_dist

                loc_id = edge_attrs.get("associated_location_id")
                loc = loc_map.get(loc_id) if loc_id else None
                seg_status = "OPEN"
                if loc:
                    if loc.current_status == "CAUTION":
                        seg_status = "CAUTION"
                        caution_edges.append({
                            "edge_id": edge_attrs["edge_id"],
                            "name": edge_attrs["name"],
                            "location_name": loc.name,
                            "water_depth_cm": loc.current_water_depth_cm
                        })

                coords = edge_attrs.get("coordinates", [])
                # If coords are backwards relative to direction of travel, orient correctly
                start_node = node_lookup[u]
                if coords and len(coords) >= 2:
                    # check if coords[0] is closer to u or v
                    d_start = abs(coords[0][0] - start_node["lng"]) + abs(coords[0][1] - start_node["lat"])
                    d_end = abs(coords[-1][0] - start_node["lng"]) + abs(coords[-1][1] - start_node["lat"])
                    if d_end < d_start:
                        coords = list(reversed(coords))

                segments.append({
                    "edge_id": edge_attrs["edge_id"],
                    "from_node": u,
                    "to_node": v,
                    "name": edge_attrs["name"],
                    "distance_km": edge_dist,
                    "status": seg_status,
                    "associated_location_id": loc_id,
                    "associated_location_name": loc.name if loc else None,
                    "water_depth_cm": loc.current_water_depth_cm if loc else None,
                    "coordinates": coords
                })

                # Route LineString Feature
                features.append({
                    "type": "Feature",
                    "geometry": {
                        "type": "LineString",
                        "coordinates": coords
                    },
                    "properties": {
                        "type": "route_segment",
                        "edge_id": edge_attrs["edge_id"],
                        "name": edge_attrs["name"],
                        "distance_km": edge_dist,
                        "status": seg_status
                    }
                })

            # Add avoided blocked segments as dashed red features for map visualization
            for b_seg in blocked_edges:
                if b_seg["coordinates"]:
                    features.append({
                        "type": "Feature",
                        "geometry": {
                            "type": "LineString",
                            "coordinates": b_seg["coordinates"]
                        },
                        "properties": {
                            "type": "avoided_blocked_segment",
                            "name": b_seg["name"],
                            "location_name": b_seg["location_name"],
                            "water_depth_cm": b_seg["water_depth_cm"],
                            "status": "CONFIRMED_BLOCKED"
                        }
                    })

            # Formulate clear human-friendly explanation
            origin_name = node_lookup[origin_node_id]["name"]
            dest_name = node_lookup[destination_node_id]["name"]
            corridor_names = " → ".join([s["name"] for s in segments])

            explanation_parts = [
                f"Calculated safe corridor from {origin_name} to {dest_name} ({total_distance:.1f} km).",
                f"Corridor sequence: {corridor_names}."
            ]

            if blocked_edges:
                avoided_names = ", ".join([f"{b['location_name']} ({b['water_depth_cm']} cm)" for b in blocked_edges])
                explanation_parts.append(
                    f"SAFELY DETOURED around {len(blocked_edges)} confirmed blocked segment(s): {avoided_names}."
                )
            else:
                explanation_parts.append("Direct shortest path is clear of any confirmed underpass blockages.")

            if caution_edges:
                caution_names = ", ".join([f"{c['location_name']} ({c['water_depth_cm']} cm)" for c in caution_edges])
                explanation_parts.append(
                    f"Notice: Route passes near caution zone(s): {caution_names}. Drive with vigilance."
                )

            return {
                "success": True,
                "path_nodes": path_nodes,
                "total_distance_km": round(total_distance, 2),
                "segments": segments,
                "blocked_segments_avoided": blocked_edges,
                "caution_segments_included": caution_edges,
                "is_safe": len(blocked_edges) == 0 or avoid_blocked,
                "explanation": " ".join(explanation_parts),
                "geometry_geojson": {
                    "type": "FeatureCollection",
                    "features": features
                },
                "disclaimer": "PROTOTYPE ROUTE CALCULATION – NOT LIVE TRAFFIC NAVIGATION"
            }

        except nx.NetworkXNoPath:
            # No path found due to blocked segments
            origin_name = node_lookup[origin_node_id]["name"]
            dest_name = node_lookup[destination_node_id]["name"]
            avoided_names = ", ".join([b['location_name'] for b in blocked_edges])
            return {
                "success": False,
                "path_nodes": [],
                "total_distance_km": 0.0,
                "segments": [],
                "blocked_segments_avoided": blocked_edges,
                "caution_segments_included": [],
                "is_safe": False,
                "explanation": f"NO VIABLE PATH FOUND: All arterial routes between {origin_name} and {dest_name} are obstructed by confirmed flood closures at: {avoided_names}. Wait for water levels to recede or emergency services clearance.",
                "geometry_geojson": {
                    "type": "FeatureCollection",
                    "features": [
                        {
                            "type": "Feature",
                            "geometry": {"type": "LineString", "coordinates": b["coordinates"]},
                            "properties": {"type": "avoided_blocked_segment", "name": b["name"], "status": "CONFIRMED_BLOCKED"}
                        }
                        for b in blocked_edges if b.get("coordinates")
                    ]
                },
                "disclaimer": "PROTOTYPE ROUTE CALCULATION – NOT LIVE TRAFFIC NAVIGATION"
            }

route_engine = RouteEngine()
