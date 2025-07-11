// Sitemap generation utility
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapGenerator {
  private static instance: SitemapGenerator;
  
  public static getInstance(): SitemapGenerator {
    if (!SitemapGenerator.instance) {
      SitemapGenerator.instance = new SitemapGenerator();
    }
    return SitemapGenerator.instance;
  }

  generateSitemap(urls: SitemapUrl[]): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const urlsetClose = '</urlset>';

    const urlEntries = urls.map(url => {
      const urlOpen = '  <url>';
      const urlClose = '  </url>';
      const loc = `    <loc>${url.loc}</loc>`;
      const lastmod = url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>` : '';
      const changefreq = url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>` : '';
      const priority = url.priority ? `    <priority>${url.priority}</priority>` : '';

      return [urlOpen, loc, lastmod, changefreq, priority, urlClose]
        .filter(line => line !== '')
        .join('\n');
    }).join('\n');

    return [xmlHeader, urlsetOpen, urlEntries, urlsetClose].join('\n');
  }

  getStaticUrls(): SitemapUrl[] {
    const baseUrl = 'https://ilelegal.com';
    const today = new Date().toISOString().split('T')[0];

    return [
      {
        loc: baseUrl,
        lastmod: today,
        changefreq: 'daily',
        priority: 1.0
      },
      {
        loc: `${baseUrl}/login`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.8
      },
      {
        loc: `${baseUrl}/register`,
        lastmod: today,
        changefreq: 'monthly',
        priority: 0.8
      },
      {
        loc: `${baseUrl}/services/property-purchase`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.9
      },
      {
        loc: `${baseUrl}/services/land-title-verification`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.9
      },
      {
        loc: `${baseUrl}/services/c-of-o-verification`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.9
      },
      {
        loc: `${baseUrl}/services/deed-of-assignment`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.9
      },
      {
        loc: `${baseUrl}/services/property-documentation`,
        lastmod: today,
        changefreq: 'weekly',
        priority: 0.9
      },
      {
        loc: `${baseUrl}/blog`,
        lastmod: today,
        changefreq: 'daily',
        priority: 0.8
      }
    ];
  }

  async getDynamicUrls(): Promise<SitemapUrl[]> {
    // This would be called from your API to get dynamic URLs like lawyer profiles
    const baseUrl = 'https://ilelegal.com';
    const urls: SitemapUrl[] = [];

    try {
      // Note: In a real implementation, you'd fetch from your API
      // const lawyers = await api.lawyers.getAll();
      // lawyers.forEach(lawyer => {
      //   urls.push({
      //     loc: `${baseUrl}/profile/${lawyer.id}`,
      //     lastmod: lawyer.updated_at,
      //     changefreq: 'weekly',
      //     priority: 0.7
      //   });
      // });

      // For now, we'll add some example URLs
      const exampleLawyerIds = ['demo', 'profile-test'];
      exampleLawyerIds.forEach(id => {
        urls.push({
          loc: `${baseUrl}/profile/${id}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: 0.7
        });
      });

    } catch (error) {
      console.error('Error fetching dynamic URLs for sitemap:', error);
    }

    return urls;
  }

  async generateFullSitemap(): Promise<string> {
    const staticUrls = this.getStaticUrls();
    const dynamicUrls = await this.getDynamicUrls();
    const allUrls = [...staticUrls, ...dynamicUrls];
    
    return this.generateSitemap(allUrls);
  }
}

// Function to generate and save sitemap (would be called during build or on server)
export const generateSitemapFile = async (): Promise<void> => {
  const sitemapGenerator = SitemapGenerator.getInstance();
  const sitemapXml = await sitemapGenerator.generateFullSitemap();
  
  // In a real implementation, you'd save this to public/sitemap.xml
  console.log('Generated sitemap:', sitemapXml);
  
  // For now, we'll create a static sitemap
  return;
};