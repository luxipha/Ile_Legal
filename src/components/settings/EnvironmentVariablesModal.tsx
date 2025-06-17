import { useState } from "react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Trash2, Plus } from "lucide-react";

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
}

interface EnvironmentVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (variables: EnvironmentVariable[]) => void;
  initialVariables?: EnvironmentVariable[];
}

export const EnvironmentVariablesModal = ({
  isOpen,
  onClose,
  onSave,
  initialVariables = []
}: EnvironmentVariablesModalProps) => {
  const [variables, setVariables] = useState<EnvironmentVariable[]>(initialVariables);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newIsSecret, setNewIsSecret] = useState(false);

  const handleAddVariable = () => {
    if (!newKey.trim()) return;

    const newVariable: EnvironmentVariable = {
      id: Date.now().toString(),
      key: newKey.trim(),
      value: newValue,
      isSecret: newIsSecret
    };

    setVariables([...variables, newVariable]);
    setNewKey("");
    setNewValue("");
    setNewIsSecret(false);
  };

  const handleRemoveVariable = (id: string) => {
    setVariables(variables.filter(variable => variable.id !== id));
  };

  const handleSave = () => {
    onSave(variables);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Environment Variables" size="lg">
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mb-4">
            Configure environment variables for your application. Variables marked as secret will be encrypted.
          </p>
        </div>

        {/* Current Variables */}
        {variables.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Current Variables</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variables.map((variable) => (
                    <tr key={variable.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{variable.key}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {variable.isSecret ? "••••••••" : variable.value}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${variable.isSecret ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                          {variable.isSecret ? "Secret" : "Plain"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleRemoveVariable(variable.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add New Variable */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Variable</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <Label htmlFor="variable-key">Variable Key</Label>
              <input
                id="variable-key"
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g. API_KEY"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-5">
              <Label htmlFor="variable-value">Variable Value</Label>
              <input
                id="variable-value"
                type={newIsSecret ? "password" : "text"}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. your-api-key-here"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="col-span-2 flex items-end">
              <div className="flex items-center h-10 mt-1 space-x-2">
                <input
                  id="is-secret"
                  type="checkbox"
                  checked={newIsSecret}
                  onChange={(e) => setNewIsSecret(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="is-secret" className="text-sm">Secret</Label>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleAddVariable}
            className="bg-[#FEC85F] hover:bg-[#FEC85F]/90 text-[#1B1828]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#1B1828] hover:bg-[#1B1828]/90 text-white"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
