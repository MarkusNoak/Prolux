import { MetadataRoute } from 'next'

const BASE = 'https://proluxshine.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${BASE}/produkter`,   lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/login`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]
}
