using dev.Application.DTOs.Collaboration;
using dev.Domain.Entities;
using dev.Domain.Enums;

namespace dev.Application.Interfaces.Services;

public interface ICollaborationService
{
    /// <summary>
    /// Creates a new collaboration invitation
    /// </summary>
    Task<CollaborationDto> CreateCollaborationAsync(CreateCollaborationRequest request);
    
    /// <summary>
    /// Updates the status of a collaboration (accept/decline)
    /// </summary>
    Task<CollaborationDto> UpdateCollaborationStatusAsync(UpdateCollaborationStatusRequest request);
    
    /// <summary>
    /// Gets all collaborations for a collection
    /// </summary>
    Task<IEnumerable<CollaborationDto>> GetCollaborationsByCollectionIdAsync(int collectionId);
    
    /// <summary>
    /// Gets all pending invitations for the current user
    /// </summary>
    Task<IEnumerable<CollaborationDto>> GetPendingInvitationsAsync();
    
    /// <summary>
    /// Gets all collaborations for the current user
    /// </summary>
    Task<IEnumerable<CollaborationDto>> GetCollaborationsForUserAsync();
    
    /// <summary>
    /// Checks if a user has permission to access a collection
    /// </summary>
    Task<bool> HasCollectionAccessAsync(int collectionId, CollaborationPermission requiredPermission);
    
    /// <summary>
    /// Deletes a collaboration
    /// </summary>
    Task DeleteCollaborationAsync(int collaborationId);
}
