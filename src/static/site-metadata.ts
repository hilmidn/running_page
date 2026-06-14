interface ISiteMetadataResult {
  siteTitle: string;
  siteUrl: string;
  description: string;
  logo: string;
  navLinks: {
    name: string;
    url: string;
  }[];
}

const getBasePath = () => {
  const baseUrl = import.meta.env.BASE_URL;
  return baseUrl === '/' ? '' : baseUrl;
};

const data: ISiteMetadataResult = {
  siteTitle: 'Hellroin Running Journey',
  siteUrl: getBasePath(),
  logo: 'https://avatars.githubusercontent.com/u/20856300?v=4',
  description: 'Hellroin Run Archive',
  navLinks: [
    {
      name: 'Summary',
      url: `${getBasePath()}/summary`,
    },
    {
      name: 'Trends',
      url: `${getBasePath()}/trends`,
    },
  ],
};

export default data;
