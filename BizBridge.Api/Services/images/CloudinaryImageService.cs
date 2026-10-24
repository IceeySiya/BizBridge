
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace BizBridge.Api.Services.Images;

public class CloudinaryImageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryImageService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"];
        var apiKey = configuration["Cloudinary:ApiKey"];
        var apiSecret = configuration["Cloudinary:ApiSecret"];

        if (string.IsNullOrWhiteSpace(cloudName) ||
            string.IsNullOrWhiteSpace(apiKey) ||
            string.IsNullOrWhiteSpace(apiSecret))
        {
            throw new InvalidOperationException(
                "Cloudinary configuration is incomplete. Check the Cloudinary settings.");
        }

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<string> UploadBusinessImageAsync(
        IFormFile image,
        CancellationToken cancellationToken = default)
    {
        await using var stream = image.OpenReadStream();

        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(image.FileName, stream),
            Folder = "bizbridge/businesses"
        };

        var result = await _cloudinary.UploadAsync(
            uploadParams,
            cancellationToken);

        if (result.Error is not null ||
            string.IsNullOrWhiteSpace(result.SecureUrl?.ToString()))
        {
            throw new InvalidOperationException(
                "Cloudinary could not upload the business image.");
        }

        return result.SecureUrl.ToString();
    }
}
