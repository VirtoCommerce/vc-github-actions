export declare function findArtifact(pattern: string): Promise<string>;
export declare function getLatestRelease(repo: string): Promise<string>;
export declare function getBranchName(github: any): Promise<string>;
export declare function getRepoName(): Promise<string>;
export declare function getProjectType(): Promise<string>;
export declare function downloadFile(url: string, outPath: string): Promise<void>;
export declare function isPullRequest(github: any): Promise<boolean>;
export declare function isDependencies(github: any): Promise<boolean>;
export declare function getVersionFromDirectoryBuildProps(path: string): Promise<string>;
export declare function getInfoFromDirectoryBuildProps(path: string): Promise<any>;
export declare function getInfoFromModuleManifest(path: string): Promise<any>;
export declare function getInfoFromPackageJson(path: string): Promise<any>;
export declare function findFiles(pattern: string): Array<string>;

export const projectTypeModule: string;
export const projectTypeTheme: string;
export const projectTypePlatform: string;
export const projectTypeStorefront: string;