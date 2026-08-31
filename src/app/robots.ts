import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/crm/', '/portal/'] },
    ],
    sitemap: 'https://proluxshine.com/sitemap.xml',
  }
}
