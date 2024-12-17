import copy

from typing import Dict, Any
from comfy.api.components.schema.prompt import Prompt, PromptDictInput


def create_load_tensor_node():
    return {
        "inputs": {},
        "class_type": "LoadTensor",
        "_meta": {"title": "LoadTensor"},
    }


def create_save_tensor_node(inputs: Dict[Any, Any]):
    return {
        "inputs": inputs,
        "class_type": "SaveTensor",
        "_meta": {"title": "SaveTensor"},
    }


def convert_prompt(prompt: PromptDictInput) -> Prompt:
    # Validate the schema
    Prompt.validate(prompt)

    prompt = copy.deepcopy(prompt)

    num_primary_inputs = 0
    num_inputs = 0
    num_outputs = 0

    keys = {
        "PrimaryInputLoadImage": [],
        "LoadImage": [],
        "PreviewImage": [],
        "SaveImage": [],
    }

    for key, node in prompt.items():
        class_type = node.get("class_type")

        # Collect keys for nodes that might need to be replaced
        if class_type in keys:
            keys[class_type].append(key)

        # Count inputs and outputs
        if class_type == "PrimaryInputLoadImage":
            num_primary_inputs += 1
        elif class_type in ["LoadImage", "LoadTensor"]:
            num_inputs += 1
        elif class_type in ["PreviewImage", "SaveImage", "SaveTensor"]:
            num_outputs += 1

    # Only handle single primary input
    if num_primary_inputs > 1:
        raise Exception("too many primary inputs in prompt")

    # If there are no primary inputs, only handle single input
    if num_primary_inputs == 0 and num_inputs > 1:
        raise Exception("too many inputs in prompt")

    # Only handle single output for now
    if num_outputs > 1:
        raise Exception("too many outputs in prompt")

    if num_primary_inputs + num_inputs == 0:
        raise Exception("missing input")

    if num_outputs == 0:
        raise Exception("missing output")

    # Replace nodes
    for key in keys["PrimaryInputLoadImage"]:
        prompt[key] = create_load_tensor_node()

    if num_primary_inputs == 0 and len(keys["LoadImage"]) == 1:
        prompt[keys["LoadImage"][0]] = create_load_tensor_node()

    for key in keys["PreviewImage"] + keys["SaveImage"]:
        node = prompt[key]
        prompt[key] = create_save_tensor_node(node["inputs"])

    # Validate the processed prompt input
    prompt = Prompt.validate(prompt)

    return prompt


def update_prompt(current_prompt, node_id, values) -> Prompt:
    from collections.abc import Mapping
    
    def make_mutable(obj):
        """Convierte objetos inmutables (como InputsDict o PromptNodeDict) en dicts."""
        if isinstance(obj, Mapping):  
            return {key: make_mutable(value) for key, value in obj.items()}
        elif isinstance(obj, list): 
            return [make_mutable(item) for item in obj]
        else:
            return obj 

    mutable_prompt = make_mutable(current_prompt)

    if str(node_id) not in mutable_prompt:
        raise KeyError(f"Node ID {node_id} no encontrado en el prompt.")

    mutable_node = mutable_prompt[str(node_id)]
    if "inputs" not in mutable_node:
        raise KeyError(f"El nodo {node_id} no tiene 'inputs'.")

    for key, value in values.items():
        if key in mutable_node["inputs"]:
            mutable_node["inputs"][key] = int(value) if isinstance(value, (int, float)) else value

        else:
            raise KeyError(f"Clave '{key}' no encontrada en los inputs del nodo {node_id}.")


    return mutable_prompt
