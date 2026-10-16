import { navigation, technologies } from './content';

// The validated registry drives navigation and indexes; archive paths stay unchanged.
export const technologyTree = navigation.domains.map((domain) => ({
  ...domain,
  routes: domain.routes.map((route) => ({
    ...route,
    entries: route.entries.map((entry) => ({
      ...entry,
      members: entry.members.map((member) => ({ ...member, technology: technologies.find((technology) => technology.id === member.technology_id)! })),
    })),
  })),
}));

export const navigationNodeCount = technologyTree.reduce((total, domain) => total + 1 + domain.routes.reduce((count, route) => count + 1 + route.entries.length, 0), 0);

/** Map a verified technology ID to its three display levels; reject an absent assignment. */
export function technologyNavigation(id: string) {
  for (const domain of technologyTree) {
    for (const route of domain.routes) {
      const entry = route.entries.find((candidate) => candidate.members.some((member) => member.technology_id === id));
      if (entry) return [
        { id: domain.id, name: domain.name, level: 1 },
        { id: route.id, name: route.name, level: 2 },
        { id: entry.id, name: entry.name, level: 3 },
      ];
    }
  }
  throw new Error(`Technology navigation is missing ${id}.`);
}
