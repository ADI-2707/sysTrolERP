import sys
from pathlib import Path

from django.test import LiveServerTestCase

root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from scripts.smoke_test_deploy import run_smoke_test


class DeploymentSmokeTest(LiveServerTestCase):
    def test_live_server_smoke_check(self):
        success, errors = run_smoke_test(self.live_server_url, return_errors=True)
        assert success is True, errors
