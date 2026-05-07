export interface Drama {
  bookId: string;
  bookName: string;
  introduction: string;
  author: string;
  cover: string;
  coverWap?: string;
  inLibraryCount: number;
  playCount: string;
  sort: number;
  protagonist: string;
  tagNames: string[];
  chapterCount?: number;
}

export interface DramaVideoPath {
  quality: number;
  videoPath: string;
  isDefault: number;
  isVipEquity?: number;
}

export interface DramaCDNList {
  cdnDomain: string;
  isDefault: number;
  videoPathList: DramaVideoPath[];
}

export interface DramaEpisode {
  chapterId: string;
  chapterIndex: number;
  isCharge: number;
  chapterName: string;
  cdnList: DramaCDNList[];
}
