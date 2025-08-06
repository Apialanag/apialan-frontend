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
        first_salon_card = page.locator(".salon-card").first
        expect(first_salon_card).to_be_visible(timeout=10000)

        select_button = first_salon_card.get_by_text("Seleccionar este Espacio")
        expect(select_button).to_be_visible()
        select_button.click()

        # 3. Select a date
        # Use a fixed delay to wait for the next step to render
        page.wait_for_timeout(1000)

        datepicker_locator = page.locator(".react-datepicker")
        expect(datepicker_locator).to_be_visible()

        available_day = datepicker_locator.locator(".react-datepicker__day:not(.react-datepicker__day--disabled)").nth(4)
        available_day.click()

        page.get_by_role("button", name="Continuar →").click()

        # 4. Select start and end time
        page.wait_for_timeout(500) # Another small delay

        expect(page.get_by_role("heading", name="Paso 3: Seleccione un Horario")).to_be_visible()

        page.get_by_role("button", name="10:00").click()
        page.get_by_role("button", name="12:00").click()

        # 5. Wait for the price to be displayed and take screenshot
        total_price_element = page.locator(".resumen-horario p", has_text="Total Estimado:")
        expect(total_price_element).to_be_visible(timeout=10000) # Increased timeout for price calculation

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
