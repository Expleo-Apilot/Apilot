using AutoMapper;
using dev.Application.Common.Models;
using dev.Application.DTOs.Workspace;
using dev.Domain.Entities;
using dev.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;

namespace dev.Application.Features.Workspace.Queries;

public class GetWorkspacesByUserIdQueryHandler : IRequestHandler<GetWorkspacesByUserIdQuery, Result<List<WorkspaceDto>>>
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetWorkspacesByUserIdQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<Result<List<WorkspaceDto>>> Handle(GetWorkspacesByUserIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var workspaces = await _context.Workspaces
                .Where(w => w.UserId == request.UserId && !w.IsDeleted)
                .ToListAsync(cancellationToken);

            var workspaceDtos = _mapper.Map<List<WorkspaceDto>>(workspaces);
            return Result<List<WorkspaceDto>>.Success(workspaceDtos);
        }
        catch (Exception ex)
        {
            return Result<List<WorkspaceDto>>.Failure($"Error retrieving workspaces: {ex.Message}");
        }
    }
}
