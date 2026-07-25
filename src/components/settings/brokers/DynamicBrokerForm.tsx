import React, { useState, useEffect } from 'react';
import { BrokerProviderDefinition } from '../../../lib/brokers/brokerTypes';
import { cn } from '../../../lib/cn';
import { Eye, EyeOff, AlertCircle, Lock, Shield, ExternalLink, HelpCircle } from 'lucide-react';
import { Button } from '../../ui/Button';

interface DynamicBrokerFormProps {
  provider: BrokerProviderDefinition;
  onSubmit: (credentials: Record<string, string>, accountAlias: string) => Promise<void>;
  isLoading: boolean;
  onCancel?: () => void;
}

export const DynamicBrokerForm: React.FC<DynamicBrokerFormProps> = ({
  provider,
  onSubmit,
  isLoading,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [accountAlias, setAccountAlias] = useState(`${provider.name} Account`);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when switching provider
  useEffect(() => {
    setFormData({});
    setAccountAlias(`${provider.name} Primary Vault`);
    setValidationErrors({});
    setTouched({});
  }, [provider.providerId, provider.name]);

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Perform inline regex validation if touched
    const fieldDef = provider.fields.find(f => f.id === id);
    if (fieldDef && fieldDef.regexValidation) {
      const regex = new RegExp(fieldDef.regexValidation);
      if (value && !regex.test(value)) {
        setValidationErrors(prev => ({ ...prev, [id]: fieldDef.validationErrorMessage || 'Invalid field format' }));
      } else {
        setValidationErrors(prev => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
      }
    }
  };

  const handleBlur = (id: string) => {
    setTouched(prev => ({ ...prev, [id]: true }));
    const val = formData[id] || '';
    const fieldDef = provider.fields.find(f => f.id === id);
    if (fieldDef?.required && !val.trim()) {
      setValidationErrors(prev => ({ ...prev, [id]: `${fieldDef.label} is required` }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Final check for all required fields
    const errors: Record<string, string> = {};
    provider.fields.forEach(field => {
      const val = formData[field.id] || '';
      if (field.required && !val.trim()) {
        errors[field.id] = `${field.label} is strictly required`;
      }
      if (val && field.regexValidation) {
        const regex = new RegExp(field.regexValidation);
        if (!regex.test(val)) {
          errors[field.id] = field.validationErrorMessage || 'Invalid credential format';
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setTouched(provider.fields.reduce((acc, f) => ({ ...acc, [f.id]: true }), {}));
      return;
    }

    onSubmit(formData, accountAlias);
  };

  const inputCls = cn(
    'w-full h-11 rounded-xl border bg-surface-1 px-4 text-[13px] text-primary font-medium',
    'placeholder:text-muted outline-none transition-all duration-200 font-mono',
    'focus:border-iris/50 focus:bg-surface focus:shadow-[0_0_0_3px_rgba(var(--color-iris),0.12)]'
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5 font-sans">
      {/* Account Alias Input (Multi-Account Architecture) */}
      <div className="p-3.5 rounded-xl border border-border bg-surface-1/40">
        <label className="text-[11px] font-bold uppercase tracking-widest text-secondary mb-1 block">
          Account Name / Label <span className="normal-case font-normal text-muted">(Multi-Account Support)</span>
        </label>
        <input
          type="text"
          value={accountAlias}
          onChange={e => setAccountAlias(e.target.value)}
          placeholder="e.g. Personal Kite Portfolio or F&O Algovault"
          className={cn(inputCls, 'font-sans font-semibold text-[13px]')}
          required
        />
      </div>

      {/* Dynamic Required & Optional Fields from Provider Definition */}
      <div className="space-y-4 pt-1">
        {provider.fields.map(field => {
          const hasError = touched[field.id] && !!validationErrors[field.id];
          const isPasswordField = field.isSecret && !showSecret[field.id];

          return (
            <div key={field.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-tertiary flex items-center gap-1.5">
                  {field.label}
                  {field.required && <span className="text-iris font-mono">*</span>}
                  {field.isSecret && (
                    <span title="AES-256 Vaulted" className="text-muted inline-flex items-center gap-1 text-[10px] normal-case bg-surface-2 px-1.5 py-0.2 rounded">
                      <Lock size={9} className="text-success" /> Vaulted
                    </span>
                  )}
                </label>
                {field.helperText && (
                  <span className="text-[10px] text-muted flex items-center gap-1" title={field.helperText}>
                    <HelpCircle size={10} /> {field.helperText.slice(0, 38)}...
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={isPasswordField ? 'password' : 'text'}
                  autoComplete={field.isSecret ? 'new-password' : 'off'}
                  placeholder={field.placeholder}
                  value={formData[field.id] || ''}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  onBlur={() => handleBlur(field.id)}
                  className={cn(
                    inputCls,
                    hasError ? 'border-danger focus:border-danger bg-danger/5' : 'border-border',
                    field.isSecret && 'pr-11'
                  )}
                />
                {field.isSecret && (
                  <button
                    type="button"
                    onClick={() => setShowSecret(prev => ({ ...prev, [field.id]: !prev[field.id] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary transition-colors focus:outline-none p-1"
                    title={showSecret[field.id] ? "Hide Secret" : "Reveal Secret"}
                  >
                    {showSecret[field.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>

              {hasError && (
                <p className="text-[11px] font-semibold text-danger flex items-center gap-1.5 mt-1 animate-fadeIn">
                  <AlertCircle size={12} className="shrink-0" /> {validationErrors[field.id]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Security & Regulatory Token Expiration Advisory */}
      <div className="p-3.5 rounded-xl bg-surface-1 border border-border flex items-start gap-3 text-xs text-tertiary">
        <Shield className="w-4 h-4 text-iris shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0">
          <p className="font-semibold text-secondary">
            {provider.tokenLifecycle.expiresDaily
              ? `Mandatory SEBI Daily Expiration Policy (${provider.tokenLifecycle.expiryTimeLocal || 'Daily'})`
              : 'Institutional Long-Lived Rolling Token Authentication'}
          </p>
          <p className="text-[11px] leading-relaxed">
            Your secrets are encrypted with zero-knowledge AES-256 cloud vaults and purged from local runtime DOM memory immediately upon successful connection.
          </p>
          <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold">
            <a
              href={provider.documentation.setupGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-iris hover:underline flex items-center gap-1"
            >
              Setup Guide <ExternalLink size={11} />
            </a>
            <a
              href={provider.documentation.officialPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-tertiary hover:text-primary transition-colors flex items-center gap-1"
            >
              Official Portal <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading} className="min-w-[150px] font-bold">
          {!isLoading && `Validate & Connect ${provider.name}`}
        </Button>
      </div>
    </form>
  );
};
