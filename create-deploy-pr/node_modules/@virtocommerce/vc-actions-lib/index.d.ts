export declare function findArtifact(pattern: string): Promise<string>;
export declare function getLatestRelease(repo: string): Promise<string>;
export declare function getBranchName(github: any): Promise<string>;
export declare function getRepoName(): Promise<string>;
export declare function getProjectType(): Promise<string>;
export declare function downloadFile(url: string, outPath: string): Promise<void>;
export declare function isPullRequest(github: any): Promise<boolean>;