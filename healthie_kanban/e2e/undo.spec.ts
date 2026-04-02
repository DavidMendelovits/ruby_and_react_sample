import { test, expect } from "@playwright/test";

const GRAPHQL_URL = "https://rickandmortyapi.com/graphql";
const PAUSE = 800;

const MOCK_CHARACTERS = [
  { id: "1", name: "Rick Sanchez", image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg", status: "Alive" },
  { id: "2", name: "Morty Smith", image: "https://rickandmortyapi.com/api/character/avatar/2.jpeg", status: "Alive" },
  { id: "3", name: "Summer Smith", image: "https://rickandmortyapi.com/api/character/avatar/3.jpeg", status: "Alive" },
];

function mockGraphQL() {
  return {
    data: {
      characters: {
        info: { pages: 1, next: null },
        results: MOCK_CHARACTERS,
      },
    },
  };
}

async function createTask(page: import("@playwright/test").Page, title: string, characterIndex = 0) {
  await page.getByRole("button", { name: "+ Create Task" }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder("What needs to be done?").fill(title);
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Select character..." }).click();
  await page.waitForTimeout(200);
  await page.getByRole("option").nth(characterIndex).click();
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: "Create Task", exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();
  await page.waitForTimeout(PAUSE);
}

async function dragTask(
  page: import("@playwright/test").Page,
  taskLocator: import("@playwright/test").Locator,
  targetColumn: import("@playwright/test").Locator
) {
  const taskBox = await taskLocator.boundingBox();
  const targetBox = await targetColumn.boundingBox();
  if (!taskBox || !targetBox) throw new Error("Could not get bounding boxes");

  const startX = taskBox.x + taskBox.width / 2;
  const startY = taskBox.y + taskBox.height / 2;
  const endX = targetBox.x + targetBox.width / 2;
  const endY = targetBox.y + targetBox.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX, startY + 10, { steps: 5 });
  await page.waitForTimeout(100);
  await page.mouse.move(endX, endY, { steps: 30 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(300);
}

test("undo/redo full feature showcase", async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());

  await page.route(GRAPHQL_URL, async (route) => {
    await route.fulfill({ json: mockGraphQL() });
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Kanban Board" })).toBeVisible();
  await page.waitForTimeout(PAUSE);

  const undoButton = page.getByRole("button", { name: "Undo" });
  const redoButton = page.getByRole("button", { name: "Redo" });
  const todoColumn = page.getByRole("list", { name: "To Do" });
  const doingColumn = page.getByRole("list", { name: "Doing" });
  const doneColumn = page.getByRole("list", { name: "Done" });

  // --- Undo/redo buttons start disabled ---
  await expect(undoButton).toBeDisabled();
  await expect(redoButton).toBeDisabled();

  // --- Create three tasks ---
  await createTask(page, "Fix the portal gun", 0);
  await createTask(page, "Save dimension C-137", 1);
  await createTask(page, "Graduate from school", 2);

  await expect(todoColumn.getByText("Fix the portal gun")).toBeVisible();
  await expect(todoColumn.getByText("Save dimension C-137")).toBeVisible();
  await expect(todoColumn.getByText("Graduate from school")).toBeVisible();
  await expect(undoButton).toBeEnabled();
  await page.waitForTimeout(PAUSE);

  // --- Undo last creation, task disappears ---
  await undoButton.click();
  await expect(page.getByText("Graduate from school")).toBeHidden();
  await expect(page.locator('[aria-live="polite"]')).toContainText("Undone");
  await page.waitForTimeout(PAUSE);

  // --- Redo brings it back ---
  await expect(redoButton).toBeEnabled();
  await redoButton.click();
  await expect(todoColumn.getByText("Graduate from school")).toBeVisible();
  await expect(page.locator('[aria-live="polite"]')).toContainText("Redone");
  await page.waitForTimeout(PAUSE);

  // --- Drag "Fix the portal gun" to Doing ---
  await dragTask(page, page.getByText("Fix the portal gun"), doingColumn);
  await expect(doingColumn.getByText("Fix the portal gun")).toBeVisible();
  await page.waitForTimeout(PAUSE);

  // --- Drag "Save dimension C-137" to Done (confetti!) ---
  await dragTask(page, page.getByText("Save dimension C-137"), doneColumn);
  await expect(doneColumn.getByText("Save dimension C-137")).toBeVisible();
  await page.waitForTimeout(1500);

  // --- Undo the drag to Done, task returns to To Do ---
  await undoButton.click();
  await expect(todoColumn.getByText("Save dimension C-137")).toBeVisible();
  await page.waitForTimeout(PAUSE);

  // --- Undo the drag to Doing, task returns to To Do ---
  await undoButton.click();
  await expect(todoColumn.getByText("Fix the portal gun")).toBeVisible();
  await page.waitForTimeout(PAUSE);

  // --- Redo both drags back ---
  await redoButton.click();
  await expect(doingColumn.getByText("Fix the portal gun")).toBeVisible();
  await page.waitForTimeout(PAUSE);

  await redoButton.click();
  await expect(doneColumn.getByText("Save dimension C-137")).toBeVisible();
  await page.waitForTimeout(PAUSE);

  // --- Keyboard shortcuts: Ctrl+Z undoes, Ctrl+Shift+Z redoes ---
  await page.keyboard.press("Control+z");
  await expect(todoColumn.getByText("Save dimension C-137")).toBeVisible();
  await page.waitForTimeout(PAUSE);

  await page.keyboard.press("Control+Shift+z");
  await expect(doneColumn.getByText("Save dimension C-137")).toBeVisible();
  await page.waitForTimeout(PAUSE);

  // --- Undo everything back to empty board ---
  await page.keyboard.press("Control+z"); // undo drag to done
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+z"); // undo drag to doing
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+z"); // undo create "Graduate"
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+z"); // undo create "Save dimension"
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+z"); // undo create "Fix portal gun"
  await page.waitForTimeout(PAUSE);

  // Board is empty again
  await expect(page.getByText("Drop items here")).toHaveCount(3);
  await expect(undoButton).toBeDisabled();
  await page.waitForTimeout(PAUSE);

  // --- Redo everything back to the full state ---
  await page.keyboard.press("Control+Shift+z"); // redo create "Fix portal gun"
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+Shift+z"); // redo create "Save dimension"
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+Shift+z"); // redo create "Graduate"
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+Shift+z"); // redo drag to doing
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+Shift+z"); // redo drag to done
  await page.waitForTimeout(PAUSE);

  // Board is back to full state
  await expect(doingColumn.getByText("Fix the portal gun")).toBeVisible();
  await expect(doneColumn.getByText("Save dimension C-137")).toBeVisible();
  await expect(todoColumn.getByText("Graduate from school")).toBeVisible();
  await expect(redoButton).toBeDisabled();
  await page.waitForTimeout(PAUSE);

  // --- New action after undo clears redo stack ---
  await undoButton.click();
  await expect(redoButton).toBeEnabled();
  await page.waitForTimeout(PAUSE);

  await createTask(page, "New timeline branch", 0);
  await expect(redoButton).toBeDisabled();
  await page.waitForTimeout(PAUSE);
});
