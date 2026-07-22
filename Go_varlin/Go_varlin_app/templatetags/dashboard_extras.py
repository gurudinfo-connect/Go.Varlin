from django import template

register = template.Library()


@register.filter
def get_item(dictionary, key):
    """Usage: {{ some_dict|get_item:key }} — dashboard templates use this to
    look up a per-row submission/attempt from a dict keyed by id, since
    Django templates can't do dict[key] with a variable key directly."""
    if not dictionary:
        return None
    return dictionary.get(key)
