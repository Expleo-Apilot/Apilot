using AutoMapper;
using dev.Application.DTOs.Workspace;
using dev.Domain.Entities;
using dev.Infrastructure.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace dev.Application.Features.Workspace.Queries;

public class GetWorkspacesByUserIdQueryHandler : IRequestHandler<GetWorkspacesByUserIdQuery, List<WorkspaceDto>>
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetWorkspacesByUserIdQueryHandler(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<WorkspaceDto>> Handle(GetWorkspacesByUserIdQuery request, CancellationToken cancellationToken)
    {
        var workspaces = await _context.Workspaces
            .Where(w => w.UserId == request.UserId && !w.IsDeleted)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<WorkspaceDto>>(workspaces);
    }
}
