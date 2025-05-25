using dev.Application.DTOs.Auth;
using dev.Domain.Entities;
using dev.Infrastructure.Auth;
using Microsoft.AspNetCore.Identity;

namespace dev.Application.Services.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<IdentityRole> roleManager,
        IJwtTokenService jwtTokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {

        var existingUserByEmail = await _userManager.FindByEmailAsync(request.Email);
        if (existingUserByEmail != null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "User with this email already exists."
            };
        }


        var existingUserByUsername = await _userManager.FindByNameAsync(request.Username);
        if (existingUserByUsername != null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "User with this username already exists."
            };
        }


        var user = new ApplicationUser
        {
            UserName = request.Username,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return new AuthResponse
            {
                Success = false,
                Message = string.Join(", ", result.Errors.Select(e => e.Description))
            };
        }


        await AssignRoleAsync(user.Id, "User");


        var token = await _jwtTokenService.GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);

        return new AuthResponse
        {
            Success = true,
            Message = "User registered successfully.",
            Token = token,
            UserId = user.Id,
            Username = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList()
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid email or password."
            };
        }


        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
        {
            return new AuthResponse
            {
                Success = false,
                Message = "Invalid email or password."
            };
        }


        var token = await _jwtTokenService.GenerateJwtToken(user);
        var roles = await _userManager.GetRolesAsync(user);

        return new AuthResponse
        {
            Success = true,
            Message = "Login successful.",
            Token = token,
            UserId = user.Id,
            Username = user.UserName,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles.ToList()
        };
    }

    public async Task<bool> AssignRoleAsync(string userId, string roleName)
    {

        var roleExists = await _roleManager.RoleExistsAsync(roleName);
        if (!roleExists)
        {

            await _roleManager.CreateAsync(new IdentityRole(roleName));
        }

        // Find user
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return false;
        }


        if (!await _userManager.IsInRoleAsync(user, roleName))
        {
            await _userManager.AddToRoleAsync(user, roleName);
        }

        return true;
    }
}
