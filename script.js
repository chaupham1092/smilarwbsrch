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

          // Initialize the app with the API key
          initApp(API_KEY);
      })
      .catch(error => {
          console.error("Error loading API key:", error);
          document.getElementById("games-container").innerHTML = `<p style="color:red;">Failed to load API key. Please try again later.</p>`;
      });
});

// Function to clean the domain input (remove protocol and trailing slashes)
function cleanDomain(domain) {
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// Function to format the category string (e.g., "computers_electronics_and_technology/search_engines" => "Computers Electronics and Technology / Search Engines")
function formatCategory(category) {
  if (!category) return 'N/A'; // Return 'N/A' if category is missing

  // Split by underscores and slashes, capitalize each word, and join with spaces
  return category
    .split(/[_\//]/) // Split by underscores and slashes
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
    .join(' '); // Join with spaces
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
      content = `
        <h3>This Month Traffic</h3>
        <p><strong>Visits:</strong> ${data?.Visits?.toLocaleString() || 'N/A'}</p>
      `;
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
      if (Array.isArray(data) && data.length > 0) {
        content = `
          <h3>Similar Sites</h3>
          <ul>
            ${data.map(site => `
              <li>
                <strong>${site.Domain}</strong><br>
                <em>${site.Title}</em><br>
                <span>Global Rank: ${site.GlobalRank}</span><br>
                <span>Visits: ${site.Visits?.toLocaleString() || 'N/A'}</span>
              </li>
            `).join('')}
          </ul>
        `;
      } else {
        content = `
          <h3>Similar Sites</h3>
          <p>No similar sites data available.</p>
        `;
      }
      break;

    default:
      content = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
  }

  element.innerHTML = content;
}

// Function to add a delay between requests
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Event listener for the form submission
document.getElementById('domainForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const domain = cleanDomain(document.getElementById('domainInput').value.trim());

  // Validate the domain input
  if (!domain) {
    alert('Please enter a domain.');
    return;
  }

  // Show loading spinner
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('results').style.display = 'none';

  try {
    // Define the API endpoints
    const endpoints = [
      `https://similarweb-insights.p.rapidapi.com/website-details?domain=${domain}`,
      `https://similarweb-insights.p.rapidapi.com/traffic?domain=${domain}`,
      `https://similarweb-insights.p.rapidapi.com/rank?domain=${domain}`,
      `https://similarweb-insights.p.rapidapi.com/similar-sites?domain=${domain}`,
    ];

    // Fetch data from each endpoint with a delay between requests
    const results = [];
    for (const endpoint of endpoints) {
      const data = await fetchData(endpoint);
      results.push(data);
      await delay(1000); // Add a 1-second delay between requests
    }

    // Destructure the results
    const [websiteDetailsData, trafficData, rankData, similarSitesData] = results;

    // Update the results heading
    document.getElementById('resultsHeading').textContent = `Results for ${domain}`;

    // Display the data in the respective sections
    displayData('websiteDetailsData', websiteDetailsData);
    displayData('trafficData', trafficData);
    displayData('rankData', rankData);
    displayData('similarSitesData', similarSitesData.SimilarSites || []); // Handle SimilarSites array

    // Show results and hide loading spinner
    document.getElementById('loading').style.display = 'none';
    document.getElementById('results').style.display = 'block';
  } catch (error) {
    // Handle errors
    console.error('Error fetching data:', error);
    alert(error.message || 'Failed to fetch data. Please try again.');

    // Hide loading spinner
    document.getElementById('loading').style.display = 'none';
  }
});