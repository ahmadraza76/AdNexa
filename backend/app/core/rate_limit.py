from slowapi import Limiter
from slowapi.util import get_remote_address

# Single-process protection for the initial API. Production multi-worker deployments
# must move limiter storage to Redis before public launch.
limiter = Limiter(key_func=get_remote_address, default_limits=[])
