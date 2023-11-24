const axios = require('axios').default;
require('dotenv/config');

const repository = process.env.GH_REPOSITORY;
const token = process.env.GH_TOKEN;

const GIST = `https://gist.githubusercontent.com/hunghg255/ee79b03819fd5f9a2a92cba8839d5942/raw/projects.json?t=${Date.now()}`;

const locale = {
  handbook: 'Handbook',
  github: 'Github',
  npm: 'Npm',
  star: 'Stars',
  last_commit: 'Last Commit',
  download: 'Download',
  version: 'Version',
  marketplace: 'Marketplace',
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

    const { data } = await axios.get(GIST);
    console.log({ data });

    const formattedPosts = Object.keys(data)
      .map((key) => {
        const projects = data[key];

        return `
<h2 align='center'>${key}</h2>

<table>
  <thead align="center">
    <tr>
      ${Object.keys(projects[0])
        .map((key) => {
          return `<th>${locale[key]}</th>`;
        })
        .join('\n')}
    </tr>
  </thead>
  <tbody align="left">
  ${projects
    .map((project) => {
      return `<tr>
      <th>
        ${project.handbook}
      </th>
      <th>
        <a href="${project.github}" target="_blank">#Github</a>
      </th>
      <th>
        <a href="${project.npm || project.marketplace}" target="_blank">${
        project.npm ? '#Npm' : '#Marketplace'
      }</a>
      </th>
      <th>
        <img src="${project.star}" alt="" />
      </th>
      <th>
        <img src="${project.last_commit}" alt="" />
      </th>
      <th>
        <img src="${project.download}" alt="" />
      </th>
      <th>
        <img src="${project.version}" alt="" />
      </th>
    </tr>`;
    })
    .join('\n')}
  </tbody>
</table>
      `;
      })
      .join('\n');

    const result = readmeContent.replace(
      /<!-- start-projects -->\n(.|\n)*<!-- end-projects -->/gm,
      `<!-- start-projects -->\n${formattedPosts}\n<!-- end-projects -->`
    );

    if (result !== readmeContent) {
      console.log('Different posts list');

      await axios.put(
        `https://api.github.com/repos/${repository}/contents/README.md`,
        {
          message: 'Update README with latest posts',
          content: Buffer.from(result).toString('base64'),
          sha,
        },
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
            Authorization: `token ${token}`,
          },
        }
      );
    } else {
      console.log('No new blog posts');
    }

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
