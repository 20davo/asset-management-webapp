using AssetManagement.Api.Responses;
using Microsoft.AspNetCore.StaticFiles;

namespace AssetManagement.Api.Services
{
    public interface IEquipmentImageService
    {
        Task<ServiceResult?> ValidateImageAsync(IFormFile? image);
        Task<string?> SaveImageAsync(IFormFile? image);
        void DeleteImageFile(string? imageUrl);
        ServiceResult? ValidateFileName(string fileName);
        string GetImageFilePath(string fileName);
        string GetContentType(string fileName);
        void EnsureUploadDirectoryExists();
    }

    public class EquipmentImageService : IEquipmentImageService
    {
        private const long MaxImageBytes = 2 * 1024 * 1024;

        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        };

        private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        private readonly IWebHostEnvironment _environment;

        public EquipmentImageService(IWebHostEnvironment environment)
        {
            _environment = environment;
        }

        public async Task<ServiceResult?> ValidateImageAsync(IFormFile? image)
        {
            if (image == null || image.Length == 0)
            {
                return null;
            }

            if (image.Length > MaxImageBytes)
            {
                return ServiceResult.BadRequest("equipment.imageTooLarge", "The image must be 2 MB or smaller.");
            }

            var extension = Path.GetExtension(image.FileName);

            if (string.IsNullOrWhiteSpace(extension) || !AllowedImageExtensions.Contains(extension))
            {
                return ServiceResult.BadRequest("equipment.imageInvalidType", "Only JPG, PNG, or WEBP images can be uploaded.");
            }

            if (!string.IsNullOrWhiteSpace(image.ContentType)
                && !AllowedImageContentTypes.Contains(image.ContentType))
            {
                return ServiceResult.BadRequest("equipment.imageInvalidFile", "The uploaded file is not a valid image.");
            }

            if (!await HasAllowedImageSignatureAsync(image, extension))
            {
                return ServiceResult.BadRequest("equipment.imageInvalidContent", "The uploaded file content does not match a supported image format.");
            }

            return null;
        }

        public async Task<string?> SaveImageAsync(IFormFile? image)
        {
            if (image == null || image.Length == 0)
            {
                return null;
            }

            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            var fileName = $"{Guid.NewGuid():N}{extension}";
            var uploadDirectory = GetEquipmentUploadDirectory();

            Directory.CreateDirectory(uploadDirectory);

            var filePath = Path.Combine(uploadDirectory, fileName);

            await using var stream = File.Create(filePath);
            await image.CopyToAsync(stream);

            return $"/uploads/equipment/{fileName}";
        }

        public void DeleteImageFile(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl))
            {
                return;
            }

            var normalizedPath = imageUrl.Replace('\\', '/');

            if (!normalizedPath.StartsWith("/uploads/equipment/", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var fileName = Path.GetFileName(normalizedPath);

            if (string.IsNullOrWhiteSpace(fileName))
            {
                return;
            }

            var filePath = Path.Combine(GetEquipmentUploadDirectory(), fileName);

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }

        public ServiceResult? ValidateFileName(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName) || Path.GetFileName(fileName) != fileName)
            {
                return ServiceResult.BadRequest("equipment.imageInvalidName", "Invalid image file name.");
            }

            return null;
        }

        public string GetImageFilePath(string fileName)
        {
            return Path.Combine(GetEquipmentUploadDirectory(), fileName);
        }

        public string GetContentType(string fileName)
        {
            var contentTypeProvider = new FileExtensionContentTypeProvider();

            return contentTypeProvider.TryGetContentType(fileName, out var contentType)
                ? contentType
                : "application/octet-stream";
        }

        public void EnsureUploadDirectoryExists()
        {
            Directory.CreateDirectory(GetEquipmentUploadDirectory());
        }

        private string GetEquipmentUploadDirectory()
        {
            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
            }

            return Path.Combine(webRootPath, "uploads", "equipment");
        }

        private static async Task<bool> HasAllowedImageSignatureAsync(IFormFile image, string extension)
        {
            var header = new byte[12];

            await using var stream = image.OpenReadStream();
            var bytesRead = await stream.ReadAsync(header);

            return extension switch
            {
                ".jpg" or ".jpeg" => bytesRead >= 3
                    && header[0] == 0xFF
                    && header[1] == 0xD8
                    && header[2] == 0xFF,
                ".png" => bytesRead >= 8
                    && header[0] == 0x89
                    && header[1] == 0x50
                    && header[2] == 0x4E
                    && header[3] == 0x47
                    && header[4] == 0x0D
                    && header[5] == 0x0A
                    && header[6] == 0x1A
                    && header[7] == 0x0A,
                ".webp" => bytesRead >= 12
                    && header[0] == 0x52
                    && header[1] == 0x49
                    && header[2] == 0x46
                    && header[3] == 0x46
                    && header[8] == 0x57
                    && header[9] == 0x45
                    && header[10] == 0x42
                    && header[11] == 0x50,
                _ => false
            };
        }
    }
}
