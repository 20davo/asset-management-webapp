namespace AssetManagement.Api.Responses
{
    public class ApiResponse
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;

        public static ApiResponse Create(string code, string message)
        {
            return new ApiResponse
            {
                Code = code,
                Message = message
            };
        }
    }

    public class ApiResponse<T> : ApiResponse
    {
        public T? Data { get; set; }

        public static ApiResponse<T> Create(string code, string message, T? data)
        {
            return new ApiResponse<T>
            {
                Code = code,
                Message = message,
                Data = data
            };
        }
    }
}
