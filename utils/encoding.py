def transform_val(v):
    # print("K VS V || ", v, ' || ' , type(v))
    if isinstance(v, (list, tuple)):
        return [transform_val(item) for item in v]
    elif isinstance(v, dict):
        return {k: transform_val(val) for k, val in v.items()}
    elif hasattr(v, 'to_dict'):
        return v.to_dict()
    elif isinstance(v, (str, int, float, bool, type(None))):
        return v
    elif hasattr(v, 'value'):  # Handle enum types like NodeType
        return v.value
    else:
        return str(v)
