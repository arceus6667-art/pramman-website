export interface PublicConfig {
  csrfToken: string;
  registrationEnabled: boolean;
  privacyEmail: string;
  retentionDays: number;
  maxResumeBytes: number;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}
export async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      credentials: "same-origin",
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : options.body
            ? { "Content-Type": "application/json" }
            : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "The local server could not be reached. Please check the connection and try again.",
      0,
    );
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => ({
      error: "The server could not complete this request.",
    }))) as { error: string; fields?: Record<string, string[]> };
    throw new ApiError(data.error, response.status, data.fields);
  }
  return response.json() as Promise<T>;
}
export const publicConfig = () => request<PublicConfig>("/api/public/config");

let info: Promise<PublicConfig> | undefined;
export function academyInfo() {
  return (
    info ??
    (info = publicConfig().catch((error) => {
      info = undefined;
      throw error;
    }))
  );
}
