import json
from patients.models import AuditLog

class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only log write operations for authenticated users
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and request.user.is_authenticated:
            # Avoid logging login/token requests
            if 'api/token' in request.path or 'api/audit-logs' in request.path:
                return response

            action = request.method
            resource_type = request.path.split('/')[-2] if len(request.path.split('/')) > 2 else "unknown"

            # Try to get resource ID from path
            resource_id = request.path.split('/')[-2] if request.path.split('/')[-2].isdigit() else "0"

            try:
                AuditLog.objects.create(
                    user=request.user,
                    action=action,
                    resource_type=resource_type,
                    resource_id=resource_id,
                    details={"path": request.path, "status_code": response.status_code}
                )
            except Exception as e:
                print(f"Audit log failed: {e}")

        return response
