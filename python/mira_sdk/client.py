"""
MIRA (Market Intelligence & Research Automation) - Python API Client

Provides an object-oriented Python wrapper to interface with the
MIRA Autonomous Competitor Intelligence Engine backend REST API.
"""

import json
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any, Optional, List, Union


class MiraClient:
    """Python API Client for MIRA Competitor Intelligence Engine."""

    def __init__(
        self,
        base_url: str = "http://localhost:3000",
        workspace_id: str = "default",
        api_key: Optional[str] = None,
        timeout: int = 10,
    ):
        """
        Initialize the MIRA Python API Client.

        :param base_url: Base URL of the MIRA backend server (e.g. http://localhost:3000)
        :param workspace_id: Workspace scope identifier
        :param api_key: Optional API key for authorization
        :param timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.workspace_id = workspace_id
        self.api_key = api_key
        self.timeout = timeout

    def get_health(self) -> Dict[str, Any]:
        """Check backend server health status."""
        return self._request("GET", "/health")

    def get_profile(self) -> Dict[str, Any]:
        """Retrieve current workspace business profile."""
        return self._request("GET", "/api/profile")

    def update_profile(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update business profile.

        :param data: Profile dictionary (business_name, product_desc, target_audience, price_point)
        """
        return self._request("POST", "/api/profile", body=data)

    def get_competitors(self) -> Dict[str, Any]:
        """Retrieve list of monitored competitors."""
        return self._request("GET", "/api/competitors")

    def add_competitor(
        self, name: str, url: str, options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Add a new competitor for autonomous monitoring.

        :param name: Competitor company/product name
        :param url: Target website URL to scrape
        :param options: Additional metadata (category, frequency, tags)
        """
        payload = {"name": name, "url": url}
        if options:
            payload.update(options)
        return self._request("POST", "/api/competitors", body=payload)

    def trigger_scrape(self, competitor_id: Union[int, str]) -> Dict[str, Any]:
        """
        Trigger immediate scraper job for a competitor.

        :param competitor_id: Target competitor ID
        """
        return self._request("POST", f"/api/competitors/{competitor_id}/scrape")

    def get_changes(
        self, limit: int = 50, competitor_id: Optional[Union[int, str]] = None
    ) -> Dict[str, Any]:
        """
        Retrieve recent semantic change alerts detected across competitors.

        :param limit: Maximum records to return
        :param competitor_id: Optional competitor filter
        """
        query_params = {"limit": str(limit)}
        if competitor_id is not None:
            query_params["competitor_id"] = str(competitor_id)
        return self._request("GET", "/api/changes", query_params=query_params)

    def get_battlecards(self) -> Dict[str, Any]:
        """Retrieve auto-generated competitive battlecards."""
        return self._request("GET", "/api/battlecards")

    def simulate_war_room(
        self, scenario: Optional[str] = None, competitor_ids: Optional[List[Union[int, str]]] = None
    ) -> Dict[str, Any]:
        """
        Trigger game-theory War Room simulation for current market posture.

        :param scenario: Hypothetical move or scenario description
        :param competitor_ids: List of competitor IDs to simulate against
        """
        payload = {}
        if scenario:
            payload["scenario"] = scenario
        if competitor_ids:
            payload["competitor_ids"] = competitor_ids
        return self._request("POST", "/api/war-room/simulate", body=payload)

    def _request(
        self,
        method: str,
        endpoint: str,
        body: Optional[Dict[str, Any]] = None,
        query_params: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Helper method to execute HTTP requests using urllib."""
        url = self.base_url + endpoint
        if query_params:
            url += "?" + urllib.parse.urlencode(query_params)

        headers = {
            "Accept": "application/json",
            "X-Workspace-Id": self.workspace_id,
            "User-Agent": "MIRA-Python-SDK/1.0.0",
        }

        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode("utf-8")

        req = urllib.request.Request(
            url, data=data, headers=headers, method=method.upper()
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                status_code = resp.status
                resp_bytes = resp.read()
                if not resp_bytes:
                    return {"success": True, "code": status_code}
                try:
                    return json.loads(resp_bytes.decode("utf-8"))
                except json.JSONDecodeError:
                    return {
                        "success": False,
                        "error": "Invalid JSON response",
                        "raw": resp_bytes.decode("utf-8"),
                        "code": status_code,
                    }
        except urllib.error.HTTPError as e:
            err_bytes = e.read()
            try:
                err_json = json.loads(err_bytes.decode("utf-8"))
                if isinstance(err_json, dict):
                    err_json["code"] = e.code
                    return err_json
            except Exception:
                pass
            return {
                "success": False,
                "error": f"HTTP Error {e.code}: {e.reason}",
                "code": e.code,
            }
        except urllib.error.URLError as e:
            return {"success": False, "error": f"Connection Error: {e.reason}", "code": 0}
        except Exception as e:
            return {"success": False, "error": f"Unexpected Error: {str(e)}", "code": 0}
