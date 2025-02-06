document.addEventListener("DOMContentLoaded", function () {
  // Fetch the API key from Netlify Function
  fetch("/.netlify/functions/get-api-key")
      .then(response => {
          if (!response.ok) throw new Error("Failed to fetch API key");
          return response.json();
      })
      .then(config => {
          const API_KEY = config.API_KEY;
          if (!API_KEY) throw new Error("API key is missing");

          // Store API key for later use
          window.API_KEY = API_KEY;
      })
      .catch(error => {
          console.error("Error loading API key:", error);
          document.getElementById("games-container").innerHTML = `<p style="color:red;">Failed to load API key. Please try again later.</p>`;
      });
});

async function fetchData(url) {
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-RapidAPI-Key": window.API_KEY, // Use the stored API key
                "X-RapidAPI-Host": "similarweb-insights.p.rapidapi.com"
            }
        });
        if (!response.ok) throw new Error("API request failed");
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

// Function to clean the domain input (remove protocol and trailing slashes)
function cleanDomain(domain) {
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// Function to format the category string
function formatCategory(category) {
  if (!category) return 'N/A';
  return category.split(/[_\/]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Function to display data in a user-friendly format
function displayData(elementId, data) {
  const element = document.getElementById(elementId);
  let content = '';

  switch (elementId) {
    case 'websiteDetailsData':
      content = `
        <h3>Website Details</h3>
        <p><strong>Title:</strong> ${data?.Title || 'N/A'}</p>
        <p><strong>Description:</strong> ${data?.Description || 'N/A'}</p>
        <p><strong>Category:</strong> ${formatCategory(data?.Category)}</p>
        ${data?.Images?.Desktop ? `<img src="${data.Images.Desktop}" alt="Website Screenshot" style="max-width: 100%; height: auto; margin-top: 10px;">` : ''}
      `;
      break;

    case 'trafficData':
      content = `<h3>This Month Traffic</h3><p><strong>Visits:</strong> ${data?.Visits?.toLocaleString() || 'N/A'}</p>`;
      break;

    case 'rankData':
      content = `
        <h3>Rank Data</h3>
        <p><strong>Global Rank:</strong> ${data?.GlobalRank || 'N/A'}</p>
        <p><strong>Country Rank:</strong> ${data?.CountryRank?.Rank || 'N/A'} (${data?.CountryRank?.Country || 'N/A'})</p>
        <p><strong>Category Rank:</strong> ${data?.CategoryRank?.Rank || 'N/A'}</p>
      `;
      break;

    case 'similarSitesData':
      content = Array.isArray(data) && data.length > 0
        ? `<h3>Similar Sites</h3><ul>${data.map(site => `<li><strong>${site.Domain}</strong><br><em>${site.Title}</em><br><span>Global Rank: ${site.GlobalRank}</span><br><span>Visits: ${site.Visits?.toLocaleString() || 'N/A'}</span></li>`).join('')}</ul>`
        : `<h3>Similar Sites</h3><p>No similar sites data available.</p>`;
      break;

    default:
      content = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }
  element.innerHTML = content;
}

// Function to add a delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Event listener for form submission
document.getElementById('domainForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const domain = cleanDomain(document.getElementById('domainInput').value.trim());

  if (!domain) {
    alert('Please enter a domain.');
    return;
  }

  document.getElementById('loading').style.display = 'flex';
  document.getElementById('results').style.display = 'none';

  try {
    const endpoints = [
      `https://similarweb-insights.p.rapidapi.com/website-details?domain=${domain}`,
      `https://similarweb-insights.p.rapidapi.com/traffic?domain=${domain}`,
      `https://similarweb-insights.p.rapidapi.com/rank?domain=${domain}`,
      `https://similarweb-insights.p.rapidapi.com/similar-sites?domain=${domain}`,
    ];

    const results = [];
    for (const endpoint of endpoints) {
      const data = await fetchData(endpoint);
      results.push(data);
      await delay(1000);
    }

    const [websiteDetailsData, trafficData, rankData, similarSitesData] = results;
    document.getElementById('resultsHeading').textContent = `Results for ${domain}`;
    displayData('websiteDetailsData', websiteDetailsData);
    displayData('trafficData', trafficData);
    displayData('rankData', rankData);
    displayData('similarSitesData', similarSitesData?.SimilarSites || []);

    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';
  } catch (error) {
    console.error('Error fetching data:', error);
    alert(error.message || 'Failed to fetch data. Please try again.');
    document.getElementById('loading').style.display = 'none';
  }
});
