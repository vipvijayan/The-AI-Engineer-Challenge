export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Settings
          </h2>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">API Configuration</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Configure your API settings and credentials.</p>
          </div>
          <form className="mt-5 space-y-6">
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium leading-6 text-gray-900">
                API Key
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  name="api-key"
                  id="api-key"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Enter your API key"
                />
              </div>
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium leading-6 text-gray-900">
                Default Model
              </label>
              <div className="mt-2">
                <select
                  id="model"
                  name="model"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                >
                  <option>GPT-4</option>
                  <option>GPT-3.5</option>
                  <option>BERT</option>
                  <option>Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="max-tokens" className="block text-sm font-medium leading-6 text-gray-900">
                Max Tokens
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  name="max-tokens"
                  id="max-tokens"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Enter max tokens"
                />
              </div>
            </div>

            <div className="flex items-center gap-x-3">
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Notification Settings</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Configure how you want to receive notifications.</p>
          </div>
          <div className="mt-5 space-y-6">
            <div className="flex items-center gap-x-3">
              <input
                id="email-notifications"
                name="email-notifications"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="email-notifications" className="text-sm font-medium leading-6 text-gray-900">
                Email Notifications
              </label>
            </div>
            <div className="flex items-center gap-x-3">
              <input
                id="model-updates"
                name="model-updates"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="model-updates" className="text-sm font-medium leading-6 text-gray-900">
                Model Updates
              </label>
            </div>
            <div className="flex items-center gap-x-3">
              <input
                id="usage-alerts"
                name="usage-alerts"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <label htmlFor="usage-alerts" className="text-sm font-medium leading-6 text-gray-900">
                Usage Alerts
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 