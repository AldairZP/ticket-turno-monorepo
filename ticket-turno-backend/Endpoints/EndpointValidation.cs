using System.ComponentModel.DataAnnotations;

namespace ticket_turno.Endpoints;

public static class EndpointValidation
{
    public static Dictionary<string, string[]> ValidateModel<T>(T model)
    {
        var context = new ValidationContext(model!);
        var results = new List<ValidationResult>();
        var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

        if (Validator.TryValidateObject(model!, context, results, true))
        {
            return errors;
        }

        foreach (var validationResult in results)
        {
            var key = validationResult.MemberNames.FirstOrDefault() ?? string.Empty;

            if (!errors.TryGetValue(key, out var existingMessages))
            {
                errors[key] = [validationResult.ErrorMessage ?? "Valor invalido"];
                continue;
            }

            errors[key] = [.. existingMessages, validationResult.ErrorMessage ?? "Valor invalido"];
        }

        return errors;
    }
}
