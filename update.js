const axios = require("axios").default;
const convert = require('xml-js');
require("dotenv/config");

const repository = process.env.GH_REPOSITORY;
const token = process.env.GH_TOKEN;

const uppercaseFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

(async () => {
  try {
    const { encoding, content } = (
      await axios.get(`https://api.github.com/repos/${repository}/readme`, {
        headers: {
          Authorization: `token ${token}`,
        },
      })
    ).data;

    const readmeContent = Buffer.from(content, encoding).toString();

    const { sha } = (
      await axios.get(
        `https://api.github.com/repos/${repository}/contents/README.md`
      )
    ).data;

    const xml = (await axios.get('https://web-totals.vercel.app/sitemap.xml')).data;
    const result1 = JSON.parse(
      convert.xml2json(xml, { compact: true }),
    )
    const blogs = result1.urlset.url.filter((item) => item.loc._text.includes('/blog') && !item.loc._text.includes('/tags')).slice(2).slice(0, 5);

    const formattedPosts = blogs
      .map((post) => {
        const title = post.loc._text.split('/').slice(-1)[0].replace(/-/g, ' ');
        return `- [${uppercaseFirstLetter(title)}](${post.loc._text})`;
      })
      .join("\n");

    const result = readmeContent.replace(
      /<!-- start-blog-posts -->\n(.|\n)*<!-- end-blog-posts -->/gm,
      `<!-- start-blog-posts -->\n${formattedPosts}\n<!-- end-blog-posts -->`
    );

    if (result !== readmeContent) {
      console.log("Different posts list");

      await axios.put(
        `https://api.github.com/repos/${repository}/contents/README.md`,
        {
          message: "Update README with latest posts",
          content: Buffer.from(result).toString("base64"),
          sha,
        },
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            Authorization: `token ${token}`,
          },
        }
      );
    } else {
      console.log("No new blog posts");
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
