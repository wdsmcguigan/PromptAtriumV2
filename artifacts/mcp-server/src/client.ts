// Data access for the MCP server. The server is a thin front-end over the v2
// asset HTTP API (`/api/v2`) — it never touches the database directly, so the
// exact same code path serves the hosted (Streamable HTTP) and local (npx
// stdio) modes. Auth is the caller's PAT, forwarded as a bearer token; the v2
// API validates it and scopes every response to what that principal may read.

export interface AssetSummary {
  publicId: string;
  kindId: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  tags: string[];
  ownerHandle: string;
  updatedAt: string;
}

export interface AssetVersion {
  versionNumber: number;
  changelog: string | null;
  contentText: string | null;
  // Inline bundle fast path: [{ path, text }] for seed bundles, or a GCS
  // manifest [{ path, storageKey, size, sha256 }] for large/binary assets.
  contentFiles: Array<Record<string, unknown>> | null;
  contentHash: string | null;
  createdAt: string;
}

export interface AssetDetail extends AssetSummary {
  headVersion: AssetVersion | null;
}

export interface ListAssetsOptions {
  kind?: string | undefined;
  query?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface PromptAtriumClient {
  /** The calling principal — chiefly its `handle`, used to build asset:// URIs. */
  me(): Promise<{ handle: string; kind: string }>;
  /** The caller's readable assets, optionally filtered by kind / free text. */
  listAssets(opts?: ListAssetsOptions): Promise<AssetSummary[]>;
  /**
   * One asset by its public address (`handle/slug`), at its head version or a
   * pinned integer version. Returns null when it does not exist or the caller
   * cannot read it (the v2 API answers 404 either way, to avoid leaking).
   */
  getAsset(
    handle: string,
    slug: string,
    version?: number | undefined,
  ): Promise<AssetDetail | null>;
}

export class PromptAtriumApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PromptAtriumApiError";
  }
}

export interface HttpClientOptions {
  /** Base URL of the PromptAtrium API, e.g. https://promptatrium.com */
  baseUrl: string;
  /** The caller's PAT (`pat_…`), sent as `Authorization: Bearer`. */
  token: string;
  /** Override fetch (tests). Defaults to the global fetch (Node >= 22). */
  fetchImpl?: typeof fetch;
}

export class HttpPromptAtriumClient implements PromptAtriumClient {
  private readonly base: string;
  private readonly token: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: HttpClientOptions) {
    // Normalize to `<origin>/api/v2`, tolerating a base that already includes it.
    const trimmed = opts.baseUrl.replace(/\/+$/, "");
    this.base = trimmed.endsWith("/api/v2") ? trimmed : `${trimmed}/api/v2`;
    this.token = opts.token;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  private async get<T>(path: string): Promise<T | null> {
    const res = await this.fetchImpl(`${this.base}${path}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${this.token}`,
        accept: "application/json",
      },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new PromptAtriumApiError(
        res.status,
        `PromptAtrium API ${res.status} on ${path}${body ? `: ${body}` : ""}`,
      );
    }
    return (await res.json()) as T;
  }

  async me(): Promise<{ handle: string; kind: string }> {
    const data = await this.get<{ principal: { handle: string; kind: string } }>(
      "/me",
    );
    if (!data) throw new PromptAtriumApiError(401, "Unauthorized");
    return data.principal;
  }

  async listAssets(opts: ListAssetsOptions = {}): Promise<AssetSummary[]> {
    const params = new URLSearchParams();
    if (opts.kind) params.set("kind", opts.kind);
    if (opts.query) params.set("q", opts.query);
    params.set("limit", String(opts.limit ?? 100));
    params.set("offset", String(opts.offset ?? 0));
    const data = await this.get<{ items: AssetSummary[] }>(
      `/assets?${params.toString()}`,
    );
    return data?.items ?? [];
  }

  async getAsset(
    handle: string,
    slug: string,
    version?: number | undefined,
  ): Promise<AssetDetail | null> {
    const path =
      version === undefined
        ? `/handles/${encodeURIComponent(handle)}/assets/${encodeURIComponent(slug)}`
        : `/handles/${encodeURIComponent(handle)}/assets/${encodeURIComponent(slug)}/versions/${version}`;
    return this.get<AssetDetail>(path);
  }
}
