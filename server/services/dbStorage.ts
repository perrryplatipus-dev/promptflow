import { prisma } from '../prisma';
import { Project, PromptRun } from './storage';

export async function getProjects(): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description || '',
    tags: Array.isArray(project.tags) ? project.tags as string[] : [],
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    versionsCount: project.versionsCount,
    userId: project.userId || undefined
  }));
}

export async function getHistory(): Promise<PromptRun[]> {
  const runs = await prisma.promptRun.findMany({
    orderBy: {
      date: 'desc'
    }
  });

  return runs.map((run) => ({
    id: run.id,
    projectId: run.projectId,
    projectName: run.projectName,
    date: run.date.toISOString(),
    promptA: run.promptA,
    promptB: run.promptB,
    variables: (run.variables || {}) as Record<string, string>,
    outputA: run.outputA,
    outputB: run.outputB,
    latencyA: run.latencyA,
    latencyB: run.latencyB,
    tokensA: run.tokensA,
    tokensB: run.tokensB,
    costA: run.costA,
    costB: run.costB,
    winner: run.winner as 'A' | 'B' | 'Tie' | null,
    scores: run.scores as {
      tone: number;
      accuracy: number;
      length: number;
      grammar: number;
      overall: number;
    },
    userId: run.userId || undefined
  }));
}

export async function createProject(project: Project): Promise<Project> {
  const created = await prisma.project.create({
    data: {
      id: project.id,
      name: project.name,
      description: project.description,
      tags: project.tags,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
      versionsCount: project.versionsCount,
      userId: project.userId
    }
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description || '',
    tags: Array.isArray(created.tags) ? created.tags as string[] : [],
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    versionsCount: created.versionsCount,
    userId: created.userId || undefined
  };
}

export async function updateProject(
  id: string,
  data: Partial<Project>
): Promise<Project | null> {
  try {
    const updated = await prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.versionsCount !== undefined && {
          versionsCount: data.versionsCount
        }),
        ...(data.updatedAt !== undefined && {
          updatedAt: new Date(data.updatedAt)
        })
      }
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || '',
      tags: Array.isArray(updated.tags) ? updated.tags as string[] : [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      versionsCount: updated.versionsCount,
      userId: updated.userId || undefined
    };
  } catch {
    return null;
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  try {
    await prisma.project.delete({
      where: { id }
    });

    return true;
  } catch {
    return false;
  }
}

export async function createHistory(run: PromptRun): Promise<PromptRun> {
  const created = await prisma.promptRun.create({
    data: {
      id: run.id,
      projectId: run.projectId,
      projectName: run.projectName,
      date: new Date(run.date),
      promptA: run.promptA,
      promptB: run.promptB,
      variables: run.variables,
      outputA: run.outputA,
      outputB: run.outputB,
      latencyA: run.latencyA,
      latencyB: run.latencyB,
      tokensA: run.tokensA,
      tokensB: run.tokensB,
      costA: run.costA,
      costB: run.costB,
      winner: run.winner,
      scores: { ...run.scores },
      userId: run.userId
    }
  });

  return {
    id: created.id,
    projectId: created.projectId,
    projectName: created.projectName,
    date: created.date.toISOString(),
    promptA: created.promptA,
    promptB: created.promptB,
    variables: created.variables as Record<string, string>,
    outputA: created.outputA,
    outputB: created.outputB,
    latencyA: created.latencyA,
    latencyB: created.latencyB,
    tokensA: created.tokensA,
    tokensB: created.tokensB,
    costA: created.costA,
    costB: created.costB,
    winner: created.winner as 'A' | 'B' | 'Tie' | null,
    scores: created.scores as {
      tone: number;
      accuracy: number;
      length: number;
      grammar: number;
      overall: number;
    },
    userId: created.userId || undefined
  };
}

export async function deleteHistory(id: string): Promise<boolean> {
  try {
    await prisma.promptRun.delete({
      where: { id }
    });

    return true;
  } catch {
    return false;
  }
}

export async function updateProjectTimestamp(id: string): Promise<void> {
  await prisma.project.update({
    where: { id },
    data: {
      updatedAt: new Date()
    }
  });
}

export async function incrementProjectVersions(id: string): Promise<void> {
  await prisma.project.update({
    where: { id },
    data: {
      versionsCount: {
        increment: 1
      },
      updatedAt: new Date()
    }
  });
}
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email: email.trim().toLowerCase()
    }
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  company?: string;
  role?: string;
  avatar?: string;
}) {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      password: data.password,
    }
  });
}