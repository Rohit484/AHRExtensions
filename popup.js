//popup,js
// Function to fetch reviews from Amazon
function fetchReviews(limit = 5) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "fetchReviews", limit },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      }
    );
  });
}

// Event listener to fetch reviews from Amazon when the button is clicked
document.addEventListener("DOMContentLoaded", () => {
  const fetchReviewsButton = document.getElementById("fetchReviews");
  if (fetchReviewsButton) {
    fetchReviewsButton.addEventListener("click", async () => {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if the tab URL is a valid Amazon page
      if (
        !activeTab.url.includes("amazon.in") &&
        !activeTab.url.includes("amazon.com")
      ) {
        alert("This extension only works on Amazon product pages.");
        return;
      }

      // Execute the script in the context of the active tab
      const [response] = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => {
          const reviewElements = document.querySelectorAll(
            '[data-hook="review"]'
          );
          if (reviewElements.length === 0) {
            return { success: false, data: "No reviews found on the page." };
          }

          // Collect the first 10 reviews with titles and detailed text
          const reviews = Array.from(reviewElements)
            .slice(0, 10)
            .map((element) => {
              const titleElement = element.querySelector(
                '[data-hook="review-title"]'
              );
              const textElement = element.querySelector(
                '[data-hook="review-collapsed"] span'
              );

              return {
                title: titleElement
                  ? titleElement.textContent.trim()
                  : "No title",
                text: textElement
                  ? textElement.textContent.trim()
                  : "No detailed review",
              };
            });

          return { success: true, data: reviews };
        },
      });

      // Display results in the popup
      const reviewsList = document.getElementById("reviews");
      reviewsList.innerHTML = ""; // Clear previous results

      if (response.result.success) {
        response.result.data.forEach((review) => {
          const listItem = document.createElement("li");
          listItem.innerHTML = `<strong>${review.title}</strong><br>${review.text}`;
          reviewsList.appendChild(listItem);
        });
      } else {
        const errorMessage = document.createElement("li");
        errorMessage.textContent = response.result.data;
        reviewsList.appendChild(errorMessage);
      }
    });
  }
  //hacker news content
  // if (window.location.hostname.includes("news.ycombinator.com")) {
  //   const commentsList = document.getElementById("comments");
  //   if (commentsList) {
  //     chrome.runtime.sendMessage({ action: "fetchComments" }, (response) => {
  //       commentsList.innerHTML = ""; // Clear loading message

  //       if (response.success) {
  //         response.comments.forEach((comment) => {
  //           const listItem = document.createElement("li");
  //           listItem.innerHTML = `<strong>${comment.author}:</strong> ${comment.text}`;
  //           commentsList.appendChild(listItem);
  //         });
  //       } else {
  //         commentsList.innerHTML = "<li>No comments found.</li>";
  //       }
  //     });
  //   }
  // }

  //hacker news
  document.addEventListener("DOMContentLoaded", () => {
    const commentsList = document.getElementById("comments");

    chrome.runtime.sendMessage({ action: "fetchComments" }, (response) => {
      commentsList.innerHTML = ""; // Clear loading message

      if (response.success) {
        response.comments.forEach((comment) => {
          const listItem = document.createElement("li");
          listItem.innerHTML = `<strong>${comment.author}:</strong> ${comment.text}`;
          commentsList.appendChild(listItem);
        });
      } else {
        commentsList.innerHTML = "<li>No comments found.</li>";
      }
    });
  });
});
