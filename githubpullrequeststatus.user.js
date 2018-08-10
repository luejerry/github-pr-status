// ==UserScript==
// @name        Github Pull Request Statuses
// @namespace   github.com/luejerry
// @include     https://github.com/*
// @version     0.0.1
// @grant       none
// @author      cyricc
// @downloadURL https://github.com/luejerry/github-pr-status/raw/master/githubpullrequeststatus.user.js
// @updateURL   https://github.com/luejerry/github-pr-status/raw/master/githubpullrequeststatus.user.js
// ==/UserScript==

(function () {
  const PULL_URL_PREFIX = 'https://github.com/pulls/';
  const PULL_SUFFIXES = [
    { type: 'created', suffix: '' },
    { type: 'assigned', suffix: 'assigned' },
    { type: 'mentioned', suffix: 'mentioned' },
    { type: 'review', suffix: 'review-requested' },
  ];

  const httpGet = function (url) {
    return new Promise((resolve, reject) => {
      const xhttp = new XMLHttpRequest();
      xhttp.onload = () => {
        if (xhttp.status === 200) {
          resolve(xhttp.responseXML);
        } else {
          reject(Error(xhttp.statusText));
        }
      };
      xhttp.open('GET', url);
      xhttp.responseType = 'document';
      xhttp.send();
    });
  };

  const parseOpenClosed = function (htmlDocument) {
    const tableHeaderText = htmlDocument
      .getElementsByClassName('table-list-header-toggle')[0]
      .innerText;
    const re = /(\d+) Open\s+(\d+) Closed/g;
    const match = re.exec(tableHeaderText);
    return match ? match.slice(1, 3).map(n => parseInt(n)) : [0, 0];
  };

  const getPullStatuses = async function () {
    const urls = PULL_SUFFIXES.map(pr => {
      return {
        type: pr.type,
        url: PULL_URL_PREFIX + pr.suffix,
      };
    });
    return await Promise.all(
      urls.map(url =>
        httpGet(url.url).then(htmlDocument => {
          const openClosed = parseOpenClosed(htmlDocument);
          return {
            type: url.type,
            open: openClosed[0],
            closed: openClosed[1],
          };
        })));
  };

  const formatStatusText = function (statuses) {
    return statuses
      .filter(status => status.open > 0)
      .map(status => `${status.open} ${status.type}`)
      .join(', ');
  };

  const render = async function () {
    const statusString = formatStatusText(await getPullStatuses());
    const pullRequestButton = Array.from(document.getElementsByClassName('HeaderNavlink'))
      .find(elem => elem.innerText === 'Pull requests');
    pullRequestButton.innerText = `${pullRequestButton.innerText} (${statusString})`;
  };

  render();
})();
