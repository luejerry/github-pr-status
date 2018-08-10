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
  const PULL_SETTINGS = [
    {
      type: 'created',
      suffix: '',
      badgeColor: 'rgb(138, 138, 138)',
      enabled: true,
    },
    {
      type: 'assigned',
      suffix: 'assigned',
      badgeColor: 'rgb(81, 186, 35)',
      enabled: true,
    },
    {
      type: 'mentioned',
      suffix: 'mentioned',
      badgeColor: 'rgb(86, 153, 176)',
      enabled: true,
    },
    {
      type: 'review',
      suffix: 'review-requested',
      badgeColor: 'rgb(81, 186, 35)',
      enabled: true,
    },
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
    const urls = PULL_SETTINGS
      .filter(prSetting => prSetting.enabled)
      .map(pr => Object.assign({}, pr, { url: PULL_URL_PREFIX + pr.suffix }));
    return await Promise.all(
      urls.map(prSetting =>
        httpGet(prSetting.url).then(htmlDocument => {
          const openClosed = parseOpenClosed(htmlDocument);
          return Object.assign({}, prSetting, {
            open: openClosed[0],
            closed: openClosed[1],
          });
        })));
  };

  const formatStatusText = function (statuses) {
    const badgeGroup = document.createElement('SPAN');
    // badgeGroup.classList.add('BtnGroup-parent');
    Object.assign(badgeGroup.style, {
      cssFloat: 'right',
      paddingLeft: '6px',
      fontSize: '12px',
    });
    statuses
      .filter(status => status.open > 0)
      .map(status => {
        const badge = document.createElement('A');
        badge.href = status.url;
        badge.classList.add('BtnGroup-item');
        badge.classList.add('tooltipped');
        badge.classList.add('tooltipped-s');
        badge.setAttribute('aria-label', `${status.open} open ${status.type}`);
        Object.assign(badge.style, {
          backgroundColor: status.badgeColor,
          padding: '0px 4px',
          color: 'white',
        });
        badge.innerText = `${status.open}`;
        return badge;
      })
      .forEach(badge => badgeGroup.appendChild(badge));
    return badgeGroup;
  };

  const render = async function () {
    const statusBadges = formatStatusText(await getPullStatuses());
    const pullRequestButton = Array.from(document.getElementsByClassName('HeaderNavlink'))
      .find(elem => elem.innerText === 'Pull requests');
    pullRequestButton.appendChild(statusBadges);
  };

  render();
})();
