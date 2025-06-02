using dev.Application.DTOs.Collaboration;
using dev.Application.Interfaces.Services;
using dev.Domain.Entities;
using dev.Domain.Enums;
using dev.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace dev.Infrastructure.Services;

public class CollaborationService : ICollaborationService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ICurrentUserService _currentUserService;

    public CollaborationService(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        ICurrentUserService currentUserService)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _currentUserService = currentUserService;
    }

    public async Task<CollaborationDto> CreateCollaborationAsync(CreateCollaborationRequest request)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        // Check if the collection exists and the current user has access to it
        var collection = await _dbContext.Collections
            .FirstOrDefaultAsync(c => c.Id == request.CollectionId);

        if (collection == null)
        {
            throw new KeyNotFoundException($"Collection with ID {request.CollectionId} not found");
        }

        // Check if the current user is the owner of the collection or has edit permission
        var workspace = await _dbContext.Workspaces
            .FirstOrDefaultAsync(w => w.Id == collection.WorkSpaceId);

        bool isOwner = workspace?.UserId == _currentUserService.UserId;
        bool hasEditPermission = false;

        if (!isOwner)
        {
            hasEditPermission = await _dbContext.Collaborations
                .AnyAsync(c => c.CollectionId == request.CollectionId &&
                               c.InvitedUserId == _currentUserService.UserId &&
                               c.Status == CollaborationStatus.Accepted &&
                               c.Permission == CollaborationPermission.Edit);
        }

        if (!isOwner && !hasEditPermission)
        {
            throw new UnauthorizedAccessException("You don't have permission to invite users to this collection");
        }

        // Find the user by email
        var invitedUser = await _userManager.FindByEmailAsync(request.Email);
        if (invitedUser == null)
        {
            throw new KeyNotFoundException($"User with email {request.Email} not found");
        }

        // Check if the user is already invited or has access
        var existingCollaboration = await _dbContext.Collaborations
            .FirstOrDefaultAsync(c => c.CollectionId == request.CollectionId &&
                                      c.InvitedUserId == invitedUser.Id);

        if (existingCollaboration != null)
        {
            throw new InvalidOperationException("User is already invited to this collection");
        }

        // Create the collaboration
        var collaboration = new Collaboration
        {
            CollectionId = request.CollectionId,
            InvitedUserId = invitedUser.Id,
            InvitedByUserId = _currentUserService.UserId,
            Permission = request.Permission,
            Status = CollaborationStatus.Pending,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserName ?? "unknown",
            UpdatedAt = null,
            UpdatedBy = null
        };

        _dbContext.Collaborations.Add(collaboration);
        await _dbContext.SaveChangesAsync();

        // Return the DTO
        return new CollaborationDto
        {
            Id = collaboration.Id,
            CollectionId = collaboration.CollectionId,
            CollectionName = collection.Name,
            InvitedUserId = collaboration.InvitedUserId,
            InvitedUserEmail = invitedUser.Email,
            InvitedByUserId = collaboration.InvitedByUserId,
            InvitedByUserEmail = (await _userManager.FindByIdAsync(collaboration.InvitedByUserId))?.Email ?? string.Empty,
            Permission = collaboration.Permission,
            Status = collaboration.Status,
            CreatedAt = collaboration.CreatedAt
        };
    }

    public async Task<CollaborationDto> UpdateCollaborationStatusAsync(UpdateCollaborationStatusRequest request)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        // Find the collaboration
        var collaboration = await _dbContext.Collaborations
            .Include(c => c.Collection)
            .FirstOrDefaultAsync(c => c.Id == request.CollaborationId);

        if (collaboration == null)
        {
            throw new KeyNotFoundException($"Collaboration with ID {request.CollaborationId} not found");
        }

        // Check if the current user is the invited user
        if (collaboration.InvitedUserId != _currentUserService.UserId)
        {
            throw new UnauthorizedAccessException("You don't have permission to update this collaboration");
        }

        // Update the status
        collaboration.Status = request.Status;
        collaboration.UpdatedAt = DateTime.UtcNow;
        collaboration.UpdatedBy = _currentUserService.UserName ?? "unknown";

        await _dbContext.SaveChangesAsync();

        // Return the updated DTO
        return new CollaborationDto
        {
            Id = collaboration.Id,
            CollectionId = collaboration.CollectionId,
            CollectionName = collaboration.Collection.Name,
            InvitedUserId = collaboration.InvitedUserId,
            InvitedUserEmail = (await _userManager.FindByIdAsync(collaboration.InvitedUserId))?.Email ?? string.Empty,
            InvitedByUserId = collaboration.InvitedByUserId,
            InvitedByUserEmail = (await _userManager.FindByIdAsync(collaboration.InvitedByUserId))?.Email ?? string.Empty,
            Permission = collaboration.Permission,
            Status = collaboration.Status,
            CreatedAt = collaboration.CreatedAt
        };
    }

    public async Task<IEnumerable<CollaborationDto>> GetCollaborationsByCollectionIdAsync(int collectionId)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        // Check if the collection exists and the current user has access to it
        var collection = await _dbContext.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId);

        if (collection == null)
        {
            throw new KeyNotFoundException($"Collection with ID {collectionId} not found");
        }

        // Check if the current user is the owner of the collection or has access
        var workspace = await _dbContext.Workspaces
            .FirstOrDefaultAsync(w => w.Id == collection.WorkSpaceId);

        bool isOwner = workspace?.UserId == _currentUserService.UserId;
        bool hasAccess = await _dbContext.Collaborations
            .AnyAsync(c => c.CollectionId == collectionId &&
                           c.InvitedUserId == _currentUserService.UserId &&
                           c.Status == CollaborationStatus.Accepted);

        if (!isOwner && !hasAccess)
        {
            throw new UnauthorizedAccessException("You don't have permission to view collaborations for this collection");
        }

        // Get all collaborations for the collection
        var collaborations = await _dbContext.Collaborations
            .Where(c => c.CollectionId == collectionId)
            .ToListAsync();

        // Convert to DTOs
        var dtos = new List<CollaborationDto>();
        foreach (var collaboration in collaborations)
        {
            var invitedUser = await _userManager.FindByIdAsync(collaboration.InvitedUserId);
            var invitedByUser = await _userManager.FindByIdAsync(collaboration.InvitedByUserId);

            dtos.Add(new CollaborationDto
            {
                Id = collaboration.Id,
                CollectionId = collaboration.CollectionId,
                CollectionName = collection.Name,
                InvitedUserId = collaboration.InvitedUserId,
                InvitedUserEmail = invitedUser?.Email ?? string.Empty,
                InvitedByUserId = collaboration.InvitedByUserId,
                InvitedByUserEmail = invitedByUser?.Email ?? string.Empty,
                Permission = collaboration.Permission,
                Status = collaboration.Status,
                CreatedAt = collaboration.CreatedAt
            });
        }

        return dtos;
    }

    public async Task<IEnumerable<CollaborationDto>> GetPendingInvitationsAsync()
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        // Get all pending invitations for the current user
        var collaborations = await _dbContext.Collaborations
            .Include(c => c.Collection)
            .Where(c => c.InvitedUserId == _currentUserService.UserId &&
                        c.Status == CollaborationStatus.Pending)
            .ToListAsync();

        // Convert to DTOs
        var dtos = new List<CollaborationDto>();
        foreach (var collaboration in collaborations)
        {
            var invitedByUser = await _userManager.FindByIdAsync(collaboration.InvitedByUserId);

            dtos.Add(new CollaborationDto
            {
                Id = collaboration.Id,
                CollectionId = collaboration.CollectionId,
                CollectionName = collaboration.Collection.Name,
                InvitedUserId = collaboration.InvitedUserId,
                InvitedUserEmail = (await _userManager.FindByIdAsync(collaboration.InvitedUserId))?.Email ?? string.Empty,
                InvitedByUserId = collaboration.InvitedByUserId,
                InvitedByUserEmail = invitedByUser?.Email ?? string.Empty,
                Permission = collaboration.Permission,
                Status = collaboration.Status,
                CreatedAt = collaboration.CreatedAt
            });
        }

        return dtos;
    }

    public Task<IEnumerable<CollaborationDto>> GetCollaborationsForUserAsync()
    {
        throw new NotImplementedException();
    }

    public async Task<bool> HasCollectionAccessAsync(int collectionId, CollaborationPermission requiredPermission)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            return false;
        }

        // Check if the collection exists
        var collection = await _dbContext.Collections
            .FirstOrDefaultAsync(c => c.Id == collectionId);

        if (collection == null)
        {
            return false;
        }

        // Check if the current user is the owner of the collection
        var workspace = await _dbContext.Workspaces
            .FirstOrDefaultAsync(w => w.Id == collection.WorkSpaceId);

        if (workspace?.UserId == _currentUserService.UserId)
        {
            return true; // Owner has full access
        }

        // Check if the current user has the required permission
        var collaboration = await _dbContext.Collaborations
            .FirstOrDefaultAsync(c => c.CollectionId == collectionId &&
                                      c.InvitedUserId == _currentUserService.UserId &&
                                      c.Status == CollaborationStatus.Accepted);

        if (collaboration == null)
        {
            return false; // No collaboration found
        }

        // For View permission, any accepted collaboration is sufficient
        if (requiredPermission == CollaborationPermission.View)
        {
            return true;
        }

        // For Edit permission, check if the user has Edit permission
        return collaboration.Permission == CollaborationPermission.Edit;
    }

    public async Task DeleteCollaborationAsync(int collaborationId)
    {
        if (!_currentUserService.IsAuthenticated || string.IsNullOrEmpty(_currentUserService.UserId))
        {
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        // Find the collaboration
        var collaboration = await _dbContext.Collaborations
            .Include(c => c.Collection)
            .ThenInclude(c => c.WorkSpace)
            .FirstOrDefaultAsync(c => c.Id == collaborationId);

        if (collaboration == null)
        {
            throw new KeyNotFoundException($"Collaboration with ID {collaborationId} not found");
        }

        // Check if the current user is the owner of the collection or the one who invited
        bool isOwner = collaboration.Collection.WorkSpace.UserId == _currentUserService.UserId;
        bool isInviter = collaboration.InvitedByUserId == _currentUserService.UserId;

        if (!isOwner && !isInviter)
        {
            throw new UnauthorizedAccessException("You don't have permission to delete this collaboration");
        }

        // Soft delete the collaboration
        collaboration.IsDeleted = true;
        collaboration.UpdatedAt = DateTime.UtcNow;
        collaboration.UpdatedBy = _currentUserService.UserName ?? "unknown";

        await _dbContext.SaveChangesAsync();
    }
}
