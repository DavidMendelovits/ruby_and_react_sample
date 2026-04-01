import { test, expect } from "@playwright/test";

const GRAPHQL_URL = "https://rickandmortyapi.com/graphql";
const PAUSE = 500;

function mockGraphQL(characters: { id: string; name: string; image: string; status: string }[], hasNext = false) {
  return {
    data: {
      characters: {
        info: { pages: 1, next: hasNext ? 2 : null },
        results: characters,
      },
    },
  };
}

const MOCK_CHARACTERS = [
  { id: "1", name: "Rick Sanchez", image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg", status: "Alive" },
  { id: "2", name: "Morty Smith", image: "https://rickandmortyapi.com/api/character/avatar/2.jpeg", status: "Alive" },
  { id: "3", name: "Summer Smith", image: "https://rickandmortyapi.com/api/character/avatar/3.jpeg", status: "Alive" },
];

const MOCK_MORTY_RESULTS = [
  { id: "2", name: "Morty Smith", image: "https://rickandmortyapi.com/api/character/avatar/2.jpeg", status: "Alive" },
  { id: "18", name: "Antenna Morty", image: "https://rickandmortyapi.com/api/character/avatar/18.jpeg", status: "Alive" },
];

test("kanban board full workflow", async ({ page }) => {
  // Mock the Rick and Morty GraphQL API
  await page.route(GRAPHQL_URL, async (route, request) => {
    const body = JSON.parse(request.postData() || "{}");
    const filter = body.variables?.filter?.name;

    if (filter && /morty/i.test(filter)) {
      await route.fulfill({ json: mockGraphQL(MOCK_MORTY_RESULTS) });
    } else {
      await route.fulfill({ json: mockGraphQL(MOCK_CHARACTERS, true) });
    }
  });

  await page.goto("/");

  // Board renders with three columns and empty states
  await expect(page.getByRole("heading", { name: "Kanban Board" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "To Do" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Doing" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Done" })).toBeVisible();
  await expect(page.getByText("Drop items here")).toHaveCount(3);
  await page.waitForTimeout(PAUSE);

  // Open the create task modal
  await page.getByRole("button", { name: "+ Create Task" }).click();
  await expect(page.getByRole("heading", { name: "Create Task" })).toBeVisible();
  await page.waitForTimeout(PAUSE);

  // Submit is disabled without title and character
  const submitButton = page.getByRole("button", { name: "Create Task", exact: true });
  await expect(submitButton).toBeDisabled();
  await page.getByPlaceholder("What needs to be done?").fill("Some task");
  await expect(submitButton).toBeDisabled();
  await page.waitForTimeout(PAUSE);

  // Open character picker, search for "morty", verify filtered results
  await page.getByRole("button", { name: "Select character..." }).click();
  await expect(page.getByRole("option")).toHaveCount(3);
  await page.waitForTimeout(PAUSE);

  const searchInput = page.getByPlaceholder("Search characters...");
  await searchInput.pressSequentially("morty", { delay: 50 });
  await expect(page.getByRole("option").first()).toContainText(/morty/i, { timeout: 5000 });
  await expect(page.getByRole("option")).toHaveCount(2);
  await page.waitForTimeout(PAUSE);

  // Select a character and create the task
  await page.getByRole("option").first().click();
  await page.waitForTimeout(PAUSE);
  await page.getByPlaceholder("What needs to be done?").clear();
  await page.getByPlaceholder("What needs to be done?").fill("Fix the portal gun");
  await page.waitForTimeout(PAUSE);
  await submitButton.click();

  // Modal closes, task appears in To Do
  await expect(page.getByRole("heading", { name: "Create Task" })).toBeHidden();
  await expect(page.getByText("Fix the portal gun")).toBeVisible();
  await expect(page.getByText("Drop items here")).toHaveCount(2);
  await page.waitForTimeout(PAUSE);

  // Drag the task from To Do to Done
  const taskCard = page.getByText("Fix the portal gun");
  const doneColumn = page.getByRole("list", { name: "Done" });

  const taskBox = await taskCard.boundingBox();
  const doneBox = await doneColumn.boundingBox();

  if (!taskBox || !doneBox) throw new Error("Could not get bounding boxes");

  // Manual drag: move down first to exceed 5px activation distance, then to target
  await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(taskBox.x + taskBox.width / 2, taskBox.y + taskBox.height / 2 + 10, { steps: 5 });
  await page.mouse.move(doneBox.x + doneBox.width / 2, doneBox.y + doneBox.height / 2, { steps: 20 });
  await page.mouse.up();

  // Task is now in the Done column
  await expect(doneColumn.getByText("Fix the portal gun")).toBeVisible();
  await expect(page.getByText("Drop items here")).toHaveCount(2);

  // Wait to capture the confetti animation
  await page.waitForTimeout(3000);
});
