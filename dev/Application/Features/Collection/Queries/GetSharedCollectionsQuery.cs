using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Common;
using dev.Application.Interfaces;
using dev.Application.Interfaces.Services;
using dev.Domain.Enums;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace dev.Application.Features.Collection.Queries
{
    public class GetSharedCollectionsQuery : IRequest<ApiResponse<List<CollectionDto>>>
    {
        // No parameters needed as we'll get collections for the current user
    }

    public class GetSharedCollectionsQueryHandler : IRequestHandler<GetSharedCollectionsQuery, ApiResponse<List<CollectionDto>>>
    {
        private readonly ICollectionService _collectionService;
        private readonly ICollaborationService _collaborationService;
        private readonly ICurrentUserService _currentUserService;

        public GetSharedCollectionsQueryHandler(
            ICollectionService collectionService, 
            ICollaborationService collaborationService,
            ICurrentUserService currentUserService)
        {
            _collectionService = collectionService;
            _collaborationService = collaborationService;
            _currentUserService = currentUserService;
        }

        public async Task<ApiResponse<List<CollectionDto>>> Handle(GetSharedCollectionsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Get the current user's ID
                var userId = _currentUserService.UserId;
                
                // Get all collaborations for the current user that have been accepted
                var collaborations = await _collaborationService.GetCollaborationsForUserAsync();
                var acceptedCollaborations = collaborations.Where(c => c.Status == CollaborationStatus.Accepted).ToList();
                
                // Get the collection IDs from the accepted collaborations
                var collectionIds = acceptedCollaborations.Select(c => c.CollectionId).ToList();
                
                // Get the collections by their IDs
                var sharedCollections = new List<CollectionDto>();
                foreach (var collectionId in collectionIds)
                {
                    var collection = await _collectionService.GetCollectionByIdAsync(collectionId);
                    if (collection != null)
                    {
                        sharedCollections.Add(collection);
                    }
                }
                
                return new ApiResponse<List<CollectionDto>>
                {
                    Success = true,
                    Data = sharedCollections,
                    Message = "Shared collections retrieved successfully"
                };
            }
            catch (Exception ex)
            {
                return new ApiResponse<List<CollectionDto>>
                {
                    Success = false,
                    Data = null,
                    Message = ex.Message
                };
            }
        }
    }
}
