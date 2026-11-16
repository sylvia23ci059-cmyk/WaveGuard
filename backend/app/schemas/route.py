from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RouteRequest(BaseModel):
    origin_node_id: str = Field(..., description="Starting network node ID")
    destination_node_id: str = Field(..., description="Destination network node ID")
    avoid_blocked: bool = Field(default=True, description="Whether to avoid CONFIRMED_BLOCKED roads")

class RouteSegmentDetail(BaseModel):
    edge_id: str
    from_node: str
    to_node: str
    name: str
    distance_km: float
    status: str
    associated_location_id: Optional[str] = None
    associated_location_name: Optional[str] = None
    water_depth_cm: Optional[float] = None
    coordinates: List[List[float]]

class RouteResponse(BaseModel):
    success: bool
    path_nodes: List[str]
    total_distance_km: float
    segments: List[RouteSegmentDetail]
    blocked_segments_avoided: List[Dict[str, Any]]
    caution_segments_included: List[Dict[str, Any]]
    is_safe: bool
    explanation: str
    geometry_geojson: Dict[str, Any]
    disclaimer: str = "PROTOTYPE ROUTE CALCULATION – NOT LIVE TRAFFIC NAVIGATION"

class GraphNode(BaseModel):
    id: str
    name: str
    lat: float
    lng: float

class GraphEdge(BaseModel):
    id: str
    from_node: str
    to_node: str
    name: str
    distance_km: float
    associated_location_id: Optional[str] = None
    status: str
    coordinates: List[List[float]]

class GraphInfoResponse(BaseModel):
    graph_id: str
    name: str
    description: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
