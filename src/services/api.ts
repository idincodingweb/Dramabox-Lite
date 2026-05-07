import { Drama, DramaEpisode } from '../types';

export async function getDramaList(): Promise<Drama[]> {
  try {
    const res = await fetch(`/api/dramas`);
    if (!res.ok) throw new Error("Failed to fetch drama list");
    const data = await res.json();
    return data as Drama[];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getDramaEpisodes(bookId: string): Promise<DramaEpisode[]> {
  try {
    const res = await fetch(`/api/episodes/${bookId}`);
    if (!res.ok) throw new Error("Failed to fetch episodes for book " + bookId);
    const data = await res.json();
    return data as DramaEpisode[];
  } catch (err) {
    console.error(err);
    return [];
  }
}
