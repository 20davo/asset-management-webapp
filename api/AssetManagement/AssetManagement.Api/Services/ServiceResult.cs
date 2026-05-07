namespace AssetManagement.Api.Services
{
    public enum ServiceResultStatus
    {
        Success,
        Created,
        BadRequest,
        NotFound,
        Unauthorized,
        Forbidden
    }

    public sealed class ServiceResult
    {
        public ServiceResultStatus Status { get; init; }
        public string Code { get; init; } = string.Empty;
        public string Message { get; init; } = string.Empty;
        public object? Data { get; init; }
        public object? RouteValues { get; init; }
        public bool WrapData { get; init; }

        public static ServiceResult Success(string code, string message, object? data = null)
        {
            return new ServiceResult
            {
                Status = ServiceResultStatus.Success,
                Code = code,
                Message = message,
                Data = data
            };
        }

        public static ServiceResult Created(string code, string message, object? data, object routeValues)
        {
            return new ServiceResult
            {
                Status = ServiceResultStatus.Created,
                Code = code,
                Message = message,
                Data = data,
                RouteValues = routeValues,
                WrapData = true
            };
        }

        public static ServiceResult BadRequest(string code, string message)
        {
            return Failure(ServiceResultStatus.BadRequest, code, message);
        }

        public static ServiceResult NotFound(string code, string message)
        {
            return Failure(ServiceResultStatus.NotFound, code, message);
        }

        public static ServiceResult Unauthorized(string code, string message)
        {
            return Failure(ServiceResultStatus.Unauthorized, code, message);
        }

        public static ServiceResult Forbidden()
        {
            return new ServiceResult { Status = ServiceResultStatus.Forbidden };
        }

        private static ServiceResult Failure(ServiceResultStatus status, string code, string message)
        {
            return new ServiceResult
            {
                Status = status,
                Code = code,
                Message = message
            };
        }
    }
}
