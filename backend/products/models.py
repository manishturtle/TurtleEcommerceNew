from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

class Product(models.Model):
    sku = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    is_serialized = models.BooleanField(
        default=False,
        help_text="If True, each unit of this product must have a unique serial number"
    )
    is_lotted = models.BooleanField(
        default=False,
        help_text="If True, inventory is tracked by lot/batch numbers"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Product"
        verbose_name_plural = "Products"
        ordering = ['name']

    def clean(self):
        if self.is_serialized and self.is_lotted:
            raise ValidationError(
                "A product cannot be both serialized and lotted at the same time"
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class ProductCategory(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Product Category"
        verbose_name_plural = "Product Categories"
        ordering = ['name']

    def __str__(self):
        return self.name

class ProductAttribute(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    data_type = models.CharField(
        max_length=20,
        choices=[
            ('text', 'Text'),
            ('number', 'Number'),
            ('boolean', 'Boolean'),
            ('date', 'Date'),
            ('select', 'Select')
        ],
        default='text'
    )
    is_required = models.BooleanField(default=False)
    options = models.JSONField(
        null=True,
        blank=True,
        help_text="List of options for select type attributes"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Product Attribute"
        verbose_name_plural = "Product Attributes"
        ordering = ['name']

    def __str__(self):
        return self.name

class ProductAttributeValue(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='attribute_values'
    )
    attribute = models.ForeignKey(
        ProductAttribute,
        on_delete=models.CASCADE,
        related_name='values'
    )
    value = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Product Attribute Value"
        verbose_name_plural = "Product Attribute Values"
        unique_together = ('product', 'attribute')
        ordering = ['product', 'attribute']

    def __str__(self):
        return f"{self.product.name} - {self.attribute.name}: {self.value}"
