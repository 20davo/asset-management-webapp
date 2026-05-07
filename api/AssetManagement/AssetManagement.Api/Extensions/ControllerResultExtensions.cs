using AssetManagement.Api.Responses;
using AssetManagement.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AssetManagement.Api.Extensions
{
    public static class ControllerResultExtensions
    {
        public static IActionResult ToActionResult(this ControllerBase controller, ServiceResult result)
        {
            return result.Status switch
            {
                ServiceResultStatus.Success => string.IsNullOrWhiteSpace(result.Code)
                    ? controller.Ok(result.Data)
                    : controller.Ok(ToApiResponse(result)),
                ServiceResultStatus.Created => controller.CreatedAtAction(
                    "GetById",
                    result.RouteValues,
                    ToApiResponse(result)),
                ServiceResultStatus.BadRequest => controller.BadRequest(ApiResponse.Create(result.Code, result.Message)),
                ServiceResultStatus.NotFound => controller.NotFound(ApiResponse.Create(result.Code, result.Message)),
                ServiceResultStatus.Unauthorized => controller.Unauthorized(ApiResponse.Create(result.Code, result.Message)),
                ServiceResultStatus.Forbidden => string.IsNullOrWhiteSpace(result.Code)
                    ? controller.Forbid()
                    : controller.StatusCode(StatusCodes.Status403Forbidden, ApiResponse.Create(result.Code, result.Message)),
                _ => controller.BadRequest(ApiResponse.Create(result.Code, result.Message))
            };
        }

        private static object ToApiResponse(ServiceResult result)
        {
            if (result.Data == null)
            {
                return ApiResponse.Create(result.Code, result.Message);
            }

            if (result.WrapData)
            {
                return ApiResponse<object>.Create(result.Code, result.Message, result.Data);
            }

            var response = new Dictionary<string, object?>
            {
                ["code"] = result.Code,
                ["message"] = result.Message
            };

            foreach (var property in result.Data.GetType().GetProperties())
            {
                var name = char.ToLowerInvariant(property.Name[0]) + property.Name[1..];
                response[name] = property.GetValue(result.Data);
            }

            return response;
        }
    }
}
