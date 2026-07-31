"""
Unit tests for Python MIRA API Client SDK
"""

import unittest
from unittest.mock import patch, MagicMock
import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from mira_sdk.client import MiraClient


class TestMiraClient(unittest.TestCase):
    def setUp(self):
        self.client = MiraClient(
            base_url="http://localhost:3000",
            workspace_id="test-workspace",
            api_key="test-api-key"
        )

    def test_init_params(self):
        self.assertEqual(self.client.base_url, "http://localhost:3000")
        self.assertEqual(self.client.workspace_id, "test-workspace")
        self.assertEqual(self.client.api_key, "test-api-key")

    @patch("urllib.request.urlopen")
    def test_get_health(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = json.dumps({"status": "ok", "version": "2.0.0"}).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        res = self.client.get_health()
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["version"], "2.0.0")

    @patch("urllib.request.urlopen")
    def test_get_competitors(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = json.dumps({
            "success": True,
            "competitors": [
                {"id": 1, "name": "Acme Corp", "url": "https://acme.com"}
            ]
        }).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        res = self.client.get_competitors()
        self.assertTrue(res["success"])
        self.assertEqual(len(res["competitors"]), 1)
        self.assertEqual(res["competitors"][0]["name"], "Acme Corp")

    @patch("urllib.request.urlopen")
    def test_add_competitor(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 201
        mock_resp.read.return_value = json.dumps({
            "success": True,
            "id": 2,
            "name": "Stark Industries",
            "url": "https://stark.com"
        }).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        res = self.client.add_competitor("Stark Industries", "https://stark.com")
        self.assertTrue(res["success"])
        self.assertEqual(res["name"], "Stark Industries")

    @patch("urllib.request.urlopen")
    def test_get_changes(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = json.dumps({
            "success": True,
            "changes": [
                {"id": 101, "impact_score": 9, "summary": "Pricing increase detected"}
            ]
        }).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        res = self.client.get_changes(limit=5, competitor_id=1)
        self.assertTrue(res["success"])
        self.assertEqual(len(res["changes"]), 1)


if __name__ == "__main__":
    unittest.main()
