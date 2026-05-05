export function formatTechStack(techStack) {
  const byCategory = {};
  for (const tech of techStack) {
    if (!byCategory[tech.category]) byCategory[tech.category] = [];
    byCategory[tech.category].push(tech.name);
  }
  return byCategory;
}

export function getTechStackSummary(intro) {
  const languages = intro.details?.languages || [];
  const frameworks = intro.details?.frameworks || [];
  const parts = [];
  if (languages.length) parts.push(languages.join('/'));
  if (frameworks.length) parts.push(frameworks.join(' + '));
  return parts.join(' | ') || intro.details?.language || 'Unknown';
}

export function getUseCaseTags(intro) {
  return intro.useCases || [];
}

export function getHighlightsList(intro) {
  return intro.highlights || [];
}

export function formatStarCount(stars) {
  if (stars >= 1000000) return `${(stars / 1000000).toFixed(1)}M`;
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`;
  return stars.toString();
}

export function getLastUpdatedDate(dateStr) {
  if (!dateStr) return 'Unknown';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function truncateDescription(desc, maxLength = 120) {
  if (!desc || desc.length <= maxLength) return desc || 'No description available';
  return desc.substring(0, maxLength) + '...';
}
