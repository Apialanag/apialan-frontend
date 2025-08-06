import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Navigate to the app
        page.goto("http://localhost:5173/")

        # 2. Wait for salon cards to load and then select one
        # Wait for the first salon card to be visible
        first_salon_card = page.locator(".salon-card").first
        expect(first_salon_card).to_be_visible(timeout=10000) # Increased timeout for loading

        # Find the select button within the first card
        select_button = first_salon_card.get_by_role("button", name="Seleccionar este Espacio")
        expect(select_button).to_be_enabled()
        select_button.click()

        # 3. Select a date
        # Wait for the calendar to be visible
        expect(page.locator(".react-datepicker")).to_be_visible()
        # Click on a valid day
        available_day = page.locator(".react-datepicker__day:not(.react-datepicker__day--disabled)").nth(4) # pick 5th available day
        available_day.click()

        # Click "Continuar"
        page.get_by_role("button", name="Continuar →").click()

        # 4. Select start and end time
        # Wait for the time selection to be visible
        expect(page.get_by_text("Hora de Inicio")).to_be_visible()

        # Select start time
        page.get_by_role("button", name="10:00").click()

        # Select end time
        page.get_by_role("button", name="12:00").click()

        # 5. Wait for the price to be displayed and take screenshot
        # We wait for the loading message to disappear first.
        expect(page.get_by_text("Calculando precio...")).to_be_hidden(timeout=10000)

        # Now, wait for the final price element to be visible
        total_price_element = page.locator(".resumen-horario p", has_text="Total Estimado:")
        expect(total_price_element).to_be_visible()

        # Take screenshot of the price summary area
        price_summary_locator = page.locator(".resumen-horario")
        expect(price_summary_locator).to_be_visible()
        price_summary_locator.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
