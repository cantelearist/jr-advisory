export function isInternalSecretAuthorized(
  provided: string | null | undefined,
  configured: string | null | undefined,
): boolean {
  const providedValue = provided?.trim();
  const configuredValue = configured?.trim();

  return Boolean(providedValue && configuredValue && providedValue === configuredValue);
}
