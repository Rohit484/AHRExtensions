// Create a general popup with a close button
function createPopup(id) {
  let popup = document.createElement("div");
  popup.className = "popup";
  popup.style.position = "absolute";
  popup.style.background = "#fff";
  popup.style.border = "1px solid #ddd";
  popup.style.padding = "20px";
  popup.style.zIndex = "1000";
  popup.style.maxWidth = "500px";
  popup.style.maxHeight = "900px";
  popup.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
  popup.style.borderRadius = "10px";
  popup.style.color = "#333";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.fontSize = "16px";
  popup.style.lineHeight = "1.5";
  popup.style.overflowY = "auto";
  popup.style.backgroundColor = "#f9f9f9";

  const closeButton = document.createElement("button");
  closeButton.innerText = "✖";
  closeButton.style.position = "absolute";
  closeButton.style.top = "10px";
  closeButton.style.right = "10px";
  closeButton.style.border = "none";
  closeButton.style.background = "#ff4d4d";
  closeButton.style.color = "#fff";
  closeButton.style.fontSize = "18px";
  closeButton.style.cursor = "pointer";
  closeButton.style.padding = "5px 10px";
  closeButton.style.borderRadius = "50%";
  closeButton.style.zIndex = "1000"; // Ensure button is clickable

  // Add event listener to close the popup when clicked
  closeButton.addEventListener("click", (event) => {
    event.stopPropagation(); // Prevent bubbling
    console.log("Close button clicked!"); // Debugging log
    if (popup) {
      popup.remove();
    }
  });

  // Adding hover effect for the close button
  closeButton.addEventListener("mouseover", () => {
    closeButton.style.backgroundColor = "#ff1a1a"; // Darker red on hover
  });

  closeButton.addEventListener("mouseout", () => {
    closeButton.style.backgroundColor = "#ff4d4d"; // Original red color
  });

  // Append the close button to the popup

  popup.appendChild(closeButton);
  popup.addEventListener("mouseleave", () => {
    popup.remove();
  });

  return popup;
}

document.addEventListener("mouseover", async (event) => {
  const target = event.target;

  // Check if the hovered element is a comment link
  if (target && target.matches("a[href*='/comments/']")) {
    // if (target && target.matches("a['/svg.icon-comment/']"))
    // if (target && target.matches("a > svg.icon-comment")) {
    // if (target && target.closest("svg.icon-comment")) {
    // Prevent multiple popups for the same element
    if (document.querySelector(".popup")) return;

    const postUrl = target.href;

    // Create and append the popup
    const popup = createPopup();
    document.body.appendChild(popup);

    // Fetch and display comments
    try {
      const comments = await fetchComments(postUrl);
      popup.innerHTML += renderComments(comments);
    } catch (err) {
      popup.innerHTML = `<p>Failed to load comments.</p>`;
    }

    // Position the popup near the hovered element
    // const rect = target.getBoundingClientRect();
    // popup.style.top = `${rect.bottom + window.scrollY}px`;
    // popup.style.left = `${rect.left + window.scrollX}px`;
    // popup.style.width = `${Math.max(rect.width / 2, 300)}px`; // Minimum width: 300px
    // popup.style.height = `${Math.max(rect.height / 2, 200)}px`;
    // Get the position and dimensions of the target element
    const rect = target.getBoundingClientRect();

    // Calculate the popup dimensions
    const popupWidth = Math.max(rect.width / 2, 300); // Minimum width: 300px
    const popupHeight = Math.max(rect.height / 2, 200); // Minimum height: 200px

    // Set the popup size
    popup.style.width = `${popupWidth}px`;
    popup.style.height = `${popupHeight}px`;

    // Position the popup in the center of the target element
    popup.style.top = `${
      rect.top + window.scrollY + rect.height / 2 - popupHeight / 2
    }px`;
    popup.style.left = `${
      rect.left + window.scrollX + rect.width / 2 - popupWidth / 2
    }px`;
    // Ensure the popup is removed when the close button is clicked
    const closeButton = popup.querySelector("button");
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation(); // Prevent triggering other hover events
      popup.remove();
    });
  }
});

// Function to fetch comments and their nested replies
async function fetchComments(url) {
  const response = await fetch(`${url}.json`);
  const data = await response.json();

  // Extract the comments section
  const comments = data[1].data.children
    .filter((comment) => comment.kind === "t1") // Ensure it's a valid comment
    .slice(0, 10) // Limit to top 10
    .map(parseComment);

  return comments;
}

// Recursive function to parse comments and their replies
function parseComment(comment) {
  const { body, author, replies } = comment.data || {};
  const parsedComment = {
    text: body || "[Deleted]",
    author: author || "[Unknown]",
    replies: [],
  };

  // Recursively parse replies if available
  if (replies && replies.data) {
    parsedComment.replies = replies.data.children
      .filter((child) => child.kind === "t1") // Only include valid comments
      .map(parseComment);
  }

  return parsedComment;
}

// Recursive function to render comments and nested replies
function renderComments(comments) {
  return `
    <ul style="list-style: none; padding-left: 20px;">
      ${comments
        .map(
          (comment) => `
            <li>
              <div style="margin-bottom: 10px;">
                <strong>${comment.author}</strong>
                <p>${comment.text}</p>
                ${
                  comment.replies.length > 0
                    ? `
                      <button class="toggle-replies" style="margin-bottom: 5px; cursor: pointer;">Show Replies</button>
                      <div class="replies" style="display: none;">
                        ${renderComments(comment.replies)}
                      </div>
                    `
                    : ""
                }
              </div>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

// Event delegation for toggling replies
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("toggle-replies")) {
    const button = event.target;
    const repliesContainer = button.nextElementSibling;

    if (repliesContainer.style.display === "none") {
      repliesContainer.style.display = "block";
      button.textContent = "Hide Replies";
    } else {
      repliesContainer.style.display = "none";
      button.textContent = "Show Replies";
    }
  }
});

// Function to fetch Amazon reviews
function fetchAmazonReviews(limit = 5) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "fetchReviews", limit },
      (response) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(response);
      }
    );
  });
}

// For Amazon site functionality
if (window.location.hostname.includes("amazon")) {
  const reviewElement = document.getElementById("acrCustomerReviewText");

  reviewElement?.addEventListener("mouseenter", () => {
    const uniqueId = "amazonDialogBox";

    // Prevent duplicate dialog boxes
    if (document.getElementById(uniqueId)) return;

    const dialogBox = createPopup(uniqueId);
    dialogBox.style.position = "fixed";
    dialogBox.style.top = "50%";
    dialogBox.style.left = "50%";
    dialogBox.style.transform = "translate(-50%, -50%)";
    dialogBox.style.width = "320px";
    dialogBox.style.maxHeight = "400px";

    // Add loading text
    let head = document.createElement("p");
    head.innerText = "Loading...";
    dialogBox.appendChild(head);

    document.body.appendChild(dialogBox);

    // Fetch and display Amazon reviews
    fetchAmazonReviews().then((reviews) => {
      const unorderList = document.createElement("ul");
      unorderList.innerHTML = reviews.map((r) => `<li>${r}</li>`).join("");
      dialogBox.appendChild(unorderList);
    });

    // Close the dialog box when clicking the close button
    dialogBox.querySelector("button").addEventListener("click", () => {
      dialogBox.remove();
    });
  });
}

// Hacker News
async function fetchTopComments(postId) {
  const response = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${postId}.json`
  );
  const post = await response.json();
  const commentIds = post.kids ? post.kids.slice(0, 10) : [];
  return Promise.all(
    commentIds.map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(
        (res) => res.json()
      )
    )
  );
}

function createCommentElement(comment, level = 0) {
  const commentElement = document.createElement("div");
  commentElement.style.marginLeft = `${level * 20}px`;
  commentElement.style.marginBottom = "8px";

  const commentContent = document.createElement("div");
  commentContent.innerHTML = `<strong>${comment.by}:</strong><br>${
    comment.text || "No content"
  }`;

  // Add a toggle button to hide/unhide nested comments
  if (comment.kids && comment.kids.length > 0) {
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "Show Replies";
    toggleButton.style.marginTop = "5px";
    toggleButton.style.cursor = "pointer";

    const repliesContainer = document.createElement("div");
    repliesContainer.style.display = "none"; // Start with replies hidden

    toggleButton.addEventListener("click", () => {
      const isHidden = repliesContainer.style.display === "none";
      repliesContainer.style.display = isHidden ? "block" : "none";
      toggleButton.textContent = isHidden ? "Hide Replies" : "Show Replies";
    });

    // Fetch and append nested comments
    comment.kids.forEach((kidId) => {
      fetch(`https://hacker-news.firebaseio.com/v0/item/${kidId}.json`)
        .then((res) => res.json())
        .then((kidComment) => {
          repliesContainer.appendChild(
            createCommentElement(kidComment, level + 1)
          );
        });
    });

    commentContent.appendChild(toggleButton);
    commentContent.appendChild(repliesContainer);
  }

  commentElement.appendChild(commentContent);
  return commentElement;
}

function displayPopup(comments, x, y) {
  const popup = createPopup(); // Create a new popup element here
  popup.innerHTML = "<strong>Top 10 Comments</strong><br>";

  // Add close button again
  const closeButton = document.createElement("button");
  closeButton.textContent = "✖";
  closeButton.style.background = "transparent";
  closeButton.style.border = "none";
  closeButton.style.fontSize = "16px";
  closeButton.style.fontWeight = "bold";
  closeButton.style.color = "#888";
  closeButton.style.cursor = "pointer";
  closeButton.style.position = "absolute";
  closeButton.style.top = "5px";
  closeButton.style.right = "5px";
  closeButton.addEventListener("click", () => {
    popup.style.display = "none";
  });

  popup.appendChild(closeButton);

  comments.forEach((comment) => {
    popup.appendChild(createCommentElement(comment));
  });

  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.display = "block"; // Show popup
  document.body.appendChild(popup); // Append popup to the body
}

document.addEventListener("mouseover", async (event) => {
  const target = event.target.closest('a[href*="item?id="]');
  if (target && target.textContent.includes("comments")) {
    const postId = target.href.split("id=")[1];

    const comments = await fetchTopComments(postId);
    displayPopup(comments, event.pageX + 10, event.pageY + 10);
  }
});
